import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { sendDeleteAccountOTP, sendEmail } from '@/lib/email';
import {
  applyRateLimit,
  enforceSameOrigin,
  generateOtp,
  getClientIp,
  isValidOtp,
  normalizeText,
} from '@/lib/security';

export async function PUT(request: Request) {
  const originError = enforceSameOrigin(request);
  if (originError) {
    return originError;
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientIp = getClientIp(request);
  const rateLimit = applyRateLimit({
    key: `delete-account-otp:${clientIp}:${session.user.email}`,
    limit: 3,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many OTP requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const otp = generateOtp();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await prisma.otp.upsert({
      where: { email: session.user.email },
      update: {
        code: otp,
        expiresAt,
      },
      create: {
        email: session.user.email,
        code: otp,
        expiresAt,
      },
    });

    const emailSent = await sendDeleteAccountOTP(session.user.email, otp);

    if (!emailSent && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Failed to send OTP email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete account OTP error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const originError = enforceSameOrigin(request);
  if (originError) {
    return originError;
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const otp = normalizeText(body.otp, 6);

    if (!isValidOtp(otp)) {
      return NextResponse.json({ error: 'Valid 6-digit OTP is required' }, { status: 400 });
    }

    const email = session.user.email;

    // Verify OTP
    const dbOtp = await prisma.otp.findUnique({
      where: { email }
    });

    if (!dbOtp) return NextResponse.json({ error: 'OTP not found or expired' }, { status: 400 });
    if (dbOtp.code !== otp) return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    if (dbOtp.expiresAt < new Date()) return NextResponse.json({ error: 'OTP expired' }, { status: 400 });

    // Valid OTP! Delete it.
    await prisma.otp.delete({ where: { email } });

    // Fetch user details for email notification before deleting
    const user = await prisma.user.findUnique({ where: { email } });

    // Delete the user
    await prisma.user.delete({
      where: { email }
    });

    // Send Farewell Email
    if (user) {
      await sendEmail(
        email, 
        'Account Deleted - Cinexium',
        `
          <div style="text-align: center; margin-bottom: 28px;">
            <p style="margin: 0 0 12px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #fca5a5;">Account Deleted</p>
            <h2 style="margin: 0; font-size: 32px; color: #ffffff;">Goodbye ${user.name || 'from Cinexium'}</h2>
          </div>
          <div style="background: linear-gradient(135deg, rgba(239,68,68,0.18), rgba(127,29,29,0.12)); border: 1px solid rgba(239,68,68,0.35); border-radius: 14px; padding: 18px 20px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #f3f4f6; text-align: left;">
              Your Cinexium account has been successfully and permanently deleted. Your account data has been removed from our platform.
            </p>
          </div>
          <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px 20px;">
            <p style="margin: 0 0 10px; font-size: 14px; font-weight: 700; color: #fca5a5;">Wasn&apos;t you?</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #d1d5db;">
              If you did not authorize this deletion, please contact
              <a href="mailto:cinexium@gmail.com" style="color: #f87171; text-decoration: none; margin-left: 4px;">cinexium@gmail.com</a>
              immediately.
            </p>
          </div>
        `
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
