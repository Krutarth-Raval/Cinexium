import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { clearPushNotificationsForUser } from '@/lib/push/service';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      include: {
        actor: { select: { id: true, username: true, avatar: true, name: true, isPrivate: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Determine if the current user is following the actors
    const userFollowings = await prisma.follows.findMany({
      where: { followerId: user.id }
    });
    
    const followingIds = new Set(userFollowings.filter(f => f.status === 'ACCEPTED').map(f => f.followingId));
    const pendingIds = new Set(userFollowings.filter(f => f.status === 'PENDING').map(f => f.followingId));

    const enrichedNotifications = notifications.map(n => ({
      ...n,
      isFollowing: followingIds.has(n.actor.id),
      isFollowRequested: pendingIds.has(n.actor.id),
      isRead: user.appNotifications ? n.isRead : true // Force read if notifications disabled
    }));

    return NextResponse.json(enrichedNotifications);
  } catch (error) {
    console.error('Notifications GET API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const unreadNotifications = await prisma.notification.findMany({
      where: { userId: user.id, isRead: false },
      select: { id: true, eventKey: true },
    });

    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true, handledAt: new Date() },
    });

    await Promise.all(
      unreadNotifications.map((notification) =>
        clearPushNotificationsForUser({
          userId: user.id,
          notificationId: notification.id,
          eventKey: notification.eventKey,
          tag: notification.eventKey,
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notifications PATCH API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
