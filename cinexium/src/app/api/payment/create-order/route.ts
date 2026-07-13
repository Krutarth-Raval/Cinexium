import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { Cashfree, CFEnvironment } from 'cashfree-pg';
import { prisma } from '@/lib/prisma';

const cashfree = new Cashfree(
  process.env.NODE_ENV === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
  process.env.CASHFREE_APP_ID || '',
  process.env.CASHFREE_SECRET_KEY || ''
);

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
      select: { country: true, name: true, email: true }
    });

    const isIndia = user?.country === 'India' || user?.country === 'IN';

    let amount = 0;
    let currency = 'USD';

    if (isIndia || process.env.NODE_ENV !== 'production') {
      currency = 'INR';
      // Prices in standard format
      amount = plan === 'yearly' ? 999.00 : 99.00;
    } else {
      currency = 'USD';
      // Prices in standard format
      amount = plan === 'yearly' ? 29.99 : 2.99;
    }

    const orderId = `rcpt_${Date.now()}_${userId.substring(0, 8)}`;

    const request = {
      order_amount: amount,
      order_currency: currency,
      order_id: orderId,
      customer_details: {
        customer_id: userId,
        customer_name: user?.name || 'Customer',
        customer_email: user?.email || 'test@example.com',
        customer_phone: '9999999999' // Cashfree requires a phone number
      },
      order_meta: {
        // This is primarily for hosted checkout, but good to include
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/account?order_id={order_id}`
      },
      order_note: plan
    };

    const response = await cashfree.PGCreateOrder(request);
    
    // We return the response data which contains the payment_session_id
    // We also return our notes (userId, plan) so frontend knows about it, 
    // but typically Cashfree webhook handles verification.
    // For this flow, we'll verify manually using order_id.
    
    return NextResponse.json({
      ...response.data,
      notes: { userId, plan } // Pass notes to frontend so it can send them to verify endpoint
    });
  } catch (error: any) {
    console.error('Create Order Error:', error.response?.data || error.message || error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
