import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, plan } = await req.json();

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
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
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  } catch (error) {
    console.error('Verify Payment Error:', error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
