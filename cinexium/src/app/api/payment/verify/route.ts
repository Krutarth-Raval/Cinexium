import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Cashfree, CFEnvironment } from 'cashfree-pg';

const cashfree = new Cashfree(
  process.env.NODE_ENV === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
  process.env.CASHFREE_APP_ID || '',
  process.env.CASHFREE_SECRET_KEY || ''
);

export async function POST(req: Request) {
  try {
    const { order_id, userId, plan } = await req.json();

    const response = await cashfree.PGOrderFetchPayments(order_id);
    
    // Check if any payment was successful
    const successfulPayment = response.data.find((payment: any) => payment.payment_status === 'SUCCESS');

    if (successfulPayment) {
      // Payment is valid! Upgrade the user!
      
      const now = new Date();
      let premiumUntil = new Date();
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
  } catch (error: any) {
    console.error('Verify Payment Error:', error.response?.data || error.message || error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
