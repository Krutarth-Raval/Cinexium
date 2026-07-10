import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOTP } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { identifier, action, email, username } = await req.json();

    let targetEmail = email;

    if (action === 'login') {
      if (!identifier) {
        return NextResponse.json({ error: 'Username or email is required' }, { status: 400 });
      }
      
      // Find user by email or username
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { username: identifier }
          ]
        }
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      targetEmail = user.email;
    } else if (action === 'signup') {
      if (!email || !username) {
        return NextResponse.json({ error: 'Email and username are required' }, { status: 400 });
      }
      
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username }
          ]
        }
      });

      if (existingUser) {
        return NextResponse.json({ error: 'Email or username already in use' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
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
    
  } catch (error: any) {
    console.error('Send OTP Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
