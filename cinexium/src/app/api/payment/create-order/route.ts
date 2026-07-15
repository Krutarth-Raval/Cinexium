import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { enforceSameOrigin, isValidPlan } from '@/lib/security';
import { getPricingForCountry } from '@/lib/payments/pricing';
import { getPaddleCheckoutEnvironment, getPaddlePriceId } from '@/lib/payments/paddle-config';
import type { PricingResponse } from '@/lib/payments/types';
import { createCheckout } from '@/lib/payments/providers/paddle';

type CreateOrderResponse = {
  provider: 'paddle';
  orderId: string;
  paymentSessionId: string;
  environment: 'sandbox' | 'production';
  billingCountry: string;
  currency: PricingResponse['currency'];
  checkoutUrl: string | null;
  transactionId: string;
  subscriptionId: string | null;
};

export async function POST(req: Request) {
  try {
    const originError = enforceSameOrigin(req);
    if (originError) return originError;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await req.json();
    if (!isValidPlan(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { country: true, name: true, email: true }
    });

    const pricing = getPricingForCountry(user?.country ?? null);
    const priceId = getPaddlePriceId(pricing.currency, plan);

    console.info('Create Order Request', {
      provider: 'paddle',
      userId,
      plan,
      billingCountry: pricing.billingCountry,
      currency: pricing.currency,
      priceId,
    });

    const checkout = await createCheckout({
      items: [{ priceId, quantity: 1 }],
      customData: {
        userId,
        plan,
        billingCountry: pricing.billingCountry,
        currency: pricing.currency,
      },
    });

    const response: CreateOrderResponse = {
      provider: 'paddle',
      orderId: checkout.transactionId,
      paymentSessionId: checkout.checkoutUrl ?? '',
      environment: getPaddleCheckoutEnvironment(),
      billingCountry: pricing.billingCountry,
      currency: pricing.currency,
      checkoutUrl: checkout.checkoutUrl,
      transactionId: checkout.transactionId,
      subscriptionId: checkout.subscriptionId,
    };

    console.info('Create Order Response', {
      provider: response.provider,
      orderId: response.orderId,
      transactionId: response.transactionId,
      subscriptionId: response.subscriptionId,
      billingCountry: response.billingCountry,
      currency: response.currency,
      hasCheckoutUrl: Boolean(response.checkoutUrl),
      environment: response.environment,
    });

    return NextResponse.json<CreateOrderResponse>(response);
  } catch (error) {
    console.error('Create Order Error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
