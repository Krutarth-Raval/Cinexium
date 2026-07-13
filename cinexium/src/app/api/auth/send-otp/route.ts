import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOTP } from '@/lib/email';
import { applyRateLimit, enforceSameOrigin, generateOtp, getClientIp, normalizeIdentifier } from '@/lib/security';
import { isValidEmail, isValidUsername } from '@/lib/validators';

export async function POST(req: Request) {
  try {
    const originError = enforceSameOrigin(req);
    if (originError) return originError;

    const clientIp = getClientIp(req);
    const rateLimit = applyRateLimit({
      key: `send-otp:${clientIp}`,
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many OTP requests. Please try again later.' }, { status: 429 });
    }

    const { identifier, action, email, username } = await req.json();

    const normalizedAction = typeof action === 'string' ? action : '';
    const normalizedIdentifier = normalizeIdentifier(identifier, 254);
    const normalizedEmail = normalizeIdentifier(email, 254);
    const normalizedUsername = normalizeIdentifier(username, 24);
    let targetEmail = normalizedEmail;

    if (normalizedAction === 'login') {
      if (!normalizedIdentifier) {
        return NextResponse.json({ error: 'Username or email is required' }, { status: 400 });
      }
      
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: normalizedIdentifier },
            { username: normalizedIdentifier }
          ]
        }
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      targetEmail = user.email;
    } else if (normalizedAction === 'signup') {
      if (!normalizedEmail || !normalizedUsername) {
        return NextResponse.json({ error: 'Email and username are required' }, { status: 400 });
      }

      if (!isValidEmail(normalizedEmail) || !isValidUsername(normalizedUsername)) {
        return NextResponse.json({ error: 'Invalid signup details' }, { status: 400 });
      }

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: normalizedEmail },
            { username: normalizedUsername }
          ]
        }
      });

      if (existingUser) {
        return NextResponse.json({ error: 'Email or username already in use' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const otp = generateOtp();
    
    // Set expiration to 10 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Save to DB (upsert so we don't have multiple valid OTPs for same email)
    await prisma.otp.upsert({
      where: { email: targetEmail },
      update: {
        code: otp,
        expiresAt
      },
      create: {
        email: targetEmail,
        code: otp,
        expiresAt
      }
    });

    // Send email
    const emailSent = await sendOTP(targetEmail, otp);
    
    if (!emailSent) {
      // In dev, we might fail to send if EMAIL_USER is wrong, but we still return success 
      // because we console logged it.
      console.log('Failed to send email, but OTP was generated for dev testing.');
    }

    return NextResponse.json({ success: true, email: targetEmail });
    
  } catch (error) {
    console.error('Send OTP Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
