import { NextResponse } from 'next/server';

import { getPricingAmount, getPricingForCountry } from '@/lib/pricing';
import { prisma } from '@/lib/prisma';
import { calculatePaymentLinkExpiry, hasSubscriptionRequestTable, noteMissingSubscriptionRequestTable, syncSubscriptionRequestLifecycle } from '@/lib/subscriptions';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await hasSubscriptionRequestTable())) {
      noteMissingSubscriptionRequestTable();
      return NextResponse.json({ error: 'Subscription request storage is not ready yet.' }, { status: 503 });
    }

    await syncSubscriptionRequestLifecycle();

    const { id } = await context.params;
    const subscriptionRequest = await prisma.subscriptionRequest.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        plan: true,
        status: true,
        paymentEmailSentAt: true,
      },
    });

    if (!subscriptionRequest) {
      return NextResponse.json({ error: 'Payment request not found.' }, { status: 404 });
    }

    if (subscriptionRequest.status !== 'WAITING_FOR_PAYMENT') {
      return NextResponse.json({ error: 'This payment link is no longer active.' }, { status: 410 });
    }

    if (!subscriptionRequest.paymentEmailSentAt) {
      return NextResponse.json({ error: 'This payment link is no longer active.' }, { status: 410 });
    }

    const paymentLinkExpiresAt = calculatePaymentLinkExpiry(subscriptionRequest.paymentEmailSentAt);

    if (paymentLinkExpiresAt <= new Date()) {
      return NextResponse.json({ error: 'This payment link has expired.' }, { status: 410 });
    }

    const upiId = process.env.UPI_ID;
    if (!upiId) {
      return NextResponse.json({ error: 'UPI ID is not configured.' }, { status: 500 });
    }

    const pricing = getPricingForCountry('IN');
    const amount = getPricingAmount(pricing, subscriptionRequest.plan as 'monthly' | 'yearly');

    return NextResponse.json({
      plan: subscriptionRequest.plan === 'yearly' ? 'Yearly Premium' : 'Monthly Premium',
      pa: upiId,
      pn: 'Cinexium',
      am: amount.toString(),
      cu: 'INR',
      paymentLinkExpiresAt,
    });
  } catch (error) {
    console.error('Subscription payment link API Error:', error);
    return NextResponse.json({ error: 'Failed to load payment link.' }, { status: 500 });
  }
}
