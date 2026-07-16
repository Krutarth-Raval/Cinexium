import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/authOptions';
import { sendSubscriptionPaymentEmail } from '@/lib/email';
import { getPricingAmount, getPricingForCountry } from '@/lib/pricing';
import { prisma } from '@/lib/prisma';
import { enforceSameOrigin, jsonError } from '@/lib/security';
import { syncSubscriptionRequestLifecycle } from '@/lib/subscriptions';

async function getAdminUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    select: {
      id: true,
      role: true,
    },
  });
}

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const originError = enforceSameOrigin(_request);
    if (originError) return originError;

    const admin = await getAdminUser();
    if (!admin) {
      return jsonError('Unauthorized', 401);
    }

    if (admin.role !== 'admin') {
      return jsonError('Forbidden', 403);
    }

    await syncSubscriptionRequestLifecycle();

    const upiId = process.env.UPI_ID;
    if (!upiId) {
      return jsonError('UPI ID is not configured on the server.', 500);
    }

    const { id } = await context.params;
    const subscriptionRequest = await prisma.subscriptionRequest.findUnique({
      where: {
        id,
      },
    });

    if (!subscriptionRequest) {
      return jsonError('Subscription request not found', 404);
    }

    if (subscriptionRequest.paymentEmailSent) {
      return jsonError('Payment email has already been sent for this request.');
    }

    const pricing = getPricingForCountry('IN');
    const amount = getPricingAmount(pricing, subscriptionRequest.plan as 'monthly' | 'yearly');
    const paymentEmailSentAt = new Date();

    const emailSent = await sendSubscriptionPaymentEmail({
      to: subscriptionRequest.email,
      name: subscriptionRequest.username,
      plan: subscriptionRequest.plan as 'monthly' | 'yearly',
      amount,
      upiId,
      requestId: subscriptionRequest.id,
    });

    if (!emailSent) {
      return jsonError('Failed to send payment email', 500);
    }

    const updatedRequest = await prisma.subscriptionRequest.update({
      where: {
        id,
      },
      data: {
        paymentEmailSent: true,
        paymentEmailSentAt,
        status: 'WAITING_FOR_PAYMENT',
      },
    });

    return NextResponse.json({
      success: true,
      request: updatedRequest,
    });
  } catch (error) {
    console.error('Send payment email API Error:', error);
    return jsonError('Failed to send payment email', 500);
  }
}
