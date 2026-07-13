import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { applyRateLimit, enforceSameOrigin, generateOtp, getClientIp } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const originError = enforceSameOrigin(req);
    if (originError) return originError;

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const rateLimit = applyRateLimit({
      key: `pin-forgot:${user.id}:${getClientIp(req)}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many PIN reset attempts. Please try again later.' }, { status: 429 });
    }

    if (!user.chatPin) {
      return NextResponse.json({ error: 'PIN not set' }, { status: 400 });
    }

    const otp = generateOtp();
    
    // Expires in 10 minutes
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        chatPinResetOtp: otp,
        chatPinResetExpires: expires
      }
    });

    // Send email using shared email service
    const { sendEmail } = await import('@/lib/email');
    const htmlContent = `
        <div style="text-align: center;">
          <h2 style="color: #e50914;">Reset Hidden Chats PIN</h2>
          <p>Hello ${user.name || user.username},</p>
          <p>You requested to reset your PIN for Hidden Chats on Cinexium. Please use the following 6-digit OTP to reset your PIN:</p>
          <div style="background-color: #1a1d24; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="font-size: 36px; letter-spacing: 8px; margin: 0; color: #ffffff;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
    `;

    const emailSent = await sendEmail(user.email, 'Reset your Hidden Chats PIN', htmlContent);
    if (!emailSent) {
      throw new Error('Failed to send email');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot PIN Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
