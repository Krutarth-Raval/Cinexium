import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Verify the PIN
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (!user.chatPin) {
      return NextResponse.json({ error: 'PIN not set' }, { status: 400 });
    }

    const pinStr = req.nextUrl.searchParams.get('pin');
    if (!pinStr) {
      // If no pin is provided but one is set, we return success for the status check
      // Or we can return PIN required if they were trying to verify.
      // PinEntryModal expects 'PIN required' if it's set but they didn't provide it, 
      // or we can just let it fall through and PinEntryModal will handle it.
      return NextResponse.json({ error: 'PIN required' }, { status: 400 });
    }

    const isValid = await bcrypt.compare(pinStr, user.chatPin);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Verify PIN Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Set the PIN initially
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { pin } = body;

    if (!pin || pin.length !== 4) {
      return NextResponse.json({ error: 'PIN must be 4 digits' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user.chatPin) {
      return NextResponse.json({ error: 'PIN is already set' }, { status: 400 });
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { chatPin: hashedPin }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Set PIN Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
