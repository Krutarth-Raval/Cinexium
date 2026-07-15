import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { enforceSameOrigin } from '@/lib/security';
import type { PremiumPlan } from '@/lib/payments/types';
import { getTransaction } from '@/lib/payments/providers/paddle';

function isPremiumPlan(value: unknown): value is PremiumPlan {
  return value === 'monthly' || value === 'yearly';
}

export async function POST(req: Request) {
  try {
    const originError = enforceSameOrigin(req);
    if (originError) return originError;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await req.json();
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'Invalid payment verification request' }, { status: 400 });
    }

    const transaction = await getTransaction(orderId);
    const transactionUserId =
      typeof transaction.customData?.userId === 'string' ? transaction.customData.userId : null;
    const transactionPlan = transaction.customData?.plan;

    if (
      transactionUserId === userId &&
      isPremiumPlan(transactionPlan) &&
      (transaction.status === 'paid' || transaction.status === 'completed')
    ) {
      const now = new Date();
      const premiumUntil = new Date();
      if (transactionPlan === 'yearly') {
        premiumUntil.setFullYear(now.getFullYear() + 1);
      } else {
        premiumUntil.setMonth(now.getMonth() + 1);
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          isPremium: true,
          premiumType: transactionPlan,
          premiumUntil: premiumUntil
        }
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
    }
  } catch (error) {
    console.error('Verify Payment Error:', error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
