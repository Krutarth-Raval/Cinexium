import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { clearPushNotificationsForUser, markNotificationHandled } from '@/lib/push/service';

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
    const notificationId = typeof body.notificationId === 'string' ? body.notificationId : null;
    const eventKey = typeof body.eventKey === 'string' ? body.eventKey : null;
    const tag = typeof body.tag === 'string' ? body.tag : null;

    await markNotificationHandled({ userId: user.id, notificationId, eventKey });
    await clearPushNotificationsForUser({ userId: user.id, notificationId, eventKey, tag });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push handle error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
