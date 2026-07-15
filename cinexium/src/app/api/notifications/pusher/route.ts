import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getUserChannelName, pusherServer } from '@/lib/pusher';
import { prisma } from '@/lib/prisma';
import { enforceSameOrigin, isValidNotificationType, normalizeText } from '@/lib/security';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const originError = enforceSameOrigin(req);
    if (originError) return originError;

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, username: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await req.json();
    const targetUserId = normalizeText(data.targetUserId, 64);
    const type = data.type;

    if (!targetUserId || !isValidNotificationType(type)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await pusherServer.trigger(getUserChannelName(targetUserId), 'receiveNotification', {
      targetUserId,
      type,
      actor: { username: currentUser.username, id: currentUser.id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('API Notification Pusher Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
