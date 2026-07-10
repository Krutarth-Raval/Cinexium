import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { otp } = await request.json();
    if (!otp) {
      return NextResponse.json({ error: 'OTP is required' }, { status: 400 });
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
        `<h2 style="color: #e50914;">Goodbye ${user.name || ''}</h2>
        <p>Your account has been successfully and permanently deleted from Cinexium. All your data has been removed.</p>
        <p>We're sorry to see you go!</p>`
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
