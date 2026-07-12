import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Razorpay from 'razorpay';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await req.json(); // 'monthly' or 'yearly'

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { country: true }
    });

    const isIndia = user?.country === 'India' || user?.country === 'IN';

    let amount = 0;
    let currency = 'USD';

    if (isIndia) {
      currency = 'INR';
      // Prices in paise
      amount = plan === 'yearly' ? 999 * 100 : 99 * 100;
    } else {
      currency = 'USD';
      // Prices in cents
      amount = plan === 'yearly' ? 2999 : 299;
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `rcpt_${Date.now()}_${userId.substring(0, 8)}`,
      notes: {
        userId,
        plan
      }
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Create Order Error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
