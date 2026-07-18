import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, pushNotificationsEnabled: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const deviceId = typeof body.deviceId === 'string' ? body.deviceId.slice(0, 128) : '';
    const token = typeof body.token === 'string' ? body.token : null;
    const permission = typeof body.permission === 'string' ? body.permission.slice(0, 16) : 'default';
    const platform = typeof body.platform === 'string' ? body.platform.slice(0, 64) : 'web';
    const browser = typeof body.browser === 'string' ? body.browser.slice(0, 64) : null;
    const userAgent = typeof body.userAgent === 'string' ? body.userAgent.slice(0, 512) : '';
    const enabled = typeof body.enabled === 'boolean' ? body.enabled : user.pushNotificationsEnabled;
    const isActive = permission === 'granted' && enabled;

    if (!deviceId) {
      return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 });
    }

    if (!token) {
      await prisma.pushDevice.updateMany({
        where: { userId: user.id, deviceId },
        data: {
          permission,
          isActive,
          lastSeenAt: new Date(),
        },
      });

      return NextResponse.json({ success: true });
    }

    await prisma.pushDevice.upsert({
      where: { token },
      update: {
        userId: user.id,
        deviceId,
        permission,
        platform,
        browser,
        userAgent,
        isActive,
        lastSeenAt: new Date(),
      },
      create: {
        userId: user.id,
        deviceId,
        token,
        permission,
        platform,
        browser,
        userAgent,
        isActive,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push device registration error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
