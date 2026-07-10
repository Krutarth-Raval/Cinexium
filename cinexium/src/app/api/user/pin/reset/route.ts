import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { otp, newPin } = body;

    if (!otp || !newPin || newPin.length !== 4) {
      return NextResponse.json({ error: 'Valid OTP and 4-digit PIN required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (!user.chatPinResetOtp || !user.chatPinResetExpires) {
      return NextResponse.json({ error: 'No OTP request found' }, { status: 400 });
    }

    if (new Date() > user.chatPinResetExpires) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    if (user.chatPinResetOtp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    const hashedPin = await bcrypt.hash(newPin, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        chatPin: hashedPin,
        chatPinResetOtp: null,
        chatPinResetExpires: null
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reset PIN Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
