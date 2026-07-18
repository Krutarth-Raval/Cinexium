import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import type { PresencePageType } from '@/lib/push/constants';

const VALID_PAGE_TYPES: ReadonlySet<PresencePageType> = new Set([
  'chat',
  'group',
  'community',
  'comment',
  'movie',
  'series',
  'collection',
  'notifications',
  'other',
]);

function normalizePresencePageType(value: unknown): PresencePageType {
  if (typeof value !== 'string') {
    return 'other';
  }

  const trimmedValue = value.trim().slice(0, 32) as PresencePageType;
  return VALID_PAGE_TYPES.has(trimmedValue) ? trimmedValue : 'other';
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const deviceId = typeof body.deviceId === 'string' ? body.deviceId.slice(0, 128) : '';
    const pathname = typeof body.pathname === 'string' ? body.pathname.slice(0, 256) : '/';
    const pageType = normalizePresencePageType(body.pageType);
    const pageTargetId = typeof body.pageTargetId === 'string' ? body.pageTargetId.slice(0, 128) : '';
    const isVisible = Boolean(body.isVisible);
    const isFocused = Boolean(body.isFocused);

    if (!deviceId) {
      return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 });
    }

    await prisma.presenceSession.upsert({
      where: {
        userId_deviceId: {
          userId: user.id,
          deviceId,
        },
      },
      update: {
        pathname,
        pageType,
        pageTargetId,
        isVisible,
        isFocused,
        lastSeenAt: new Date(),
      },
      create: {
        userId: user.id,
        deviceId,
        pathname,
        pageType,
        pageTargetId,
        isVisible,
        isFocused,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push presence error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
