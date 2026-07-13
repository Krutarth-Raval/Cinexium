import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { applyRateLimit, enforceSameOrigin, getClientIp, isValidPin, normalizeText } from '@/lib/security';

// Verify the PIN
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const rateLimit = applyRateLimit({
      key: `pin-verify:${user.id}:${getClientIp(req)}`,
      limit: 20,
      windowMs: 15 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many PIN attempts. Please try again later.' }, { status: 429, headers: { 'Cache-Control': 'no-store' } });
    }

    if (!user.chatPin) {
      return NextResponse.json({ error: 'PIN not set' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    const pinStr = normalizeText(req.nextUrl.searchParams.get('pin'), 4);
    if (!pinStr) {
      return NextResponse.json({ error: 'PIN required' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    const isValid = await bcrypt.compare(pinStr, user.chatPin);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    }

    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Verify PIN Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Set the PIN initially
export async function POST(req: NextRequest) {
  try {
    const originError = enforceSameOrigin(req);
    if (originError) return originError;

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const pin = normalizeText(body.pin, 4);

    if (!isValidPin(pin)) {
      return NextResponse.json({ error: 'PIN must be 4 digits' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const rateLimit = applyRateLimit({
      key: `pin-set:${user.id}:${getClientIp(req)}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many PIN setup attempts. Please try again later.' }, { status: 429 });
    }

    if (user.chatPin) {
      return NextResponse.json({ error: 'PIN is already set' }, { status: 400 });
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { chatPin: hashedPin }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Set PIN Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
