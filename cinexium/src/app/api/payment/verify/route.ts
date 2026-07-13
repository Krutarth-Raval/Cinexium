import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Cashfree, CFEnvironment } from 'cashfree-pg';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { enforceSameOrigin, isValidPlan } from '@/lib/security';

const cashfree = new Cashfree(
  process.env.NODE_ENV === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
  process.env.CASHFREE_APP_ID || '',
  process.env.CASHFREE_SECRET_KEY || ''
);

export async function POST(req: Request) {
  try {
    const originError = enforceSameOrigin(req);
    if (originError) return originError;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { order_id, plan } = await req.json();
    if (!order_id || typeof order_id !== 'string' || !isValidPlan(plan)) {
      return NextResponse.json({ error: 'Invalid payment verification request' }, { status: 400 });
    }

    const response = await cashfree.PGOrderFetchPayments(order_id);
    
    const successfulPayment = response.data.find((payment: { payment_status?: string; customer_details?: { customer_id?: string } }) => {
      return payment.payment_status === 'SUCCESS' && payment.customer_details?.customer_id === userId;
    });

    if (successfulPayment) {
      const now = new Date();
      const premiumUntil = new Date();
      if (plan === 'yearly') {
        premiumUntil.setFullYear(now.getFullYear() + 1);
      } else {
        premiumUntil.setMonth(now.getMonth() + 1);
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          isPremium: true,
          premiumType: plan,
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
