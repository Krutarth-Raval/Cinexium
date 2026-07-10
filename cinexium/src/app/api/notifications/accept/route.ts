import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { actorId, notificationId } = await req.json();

    await prisma.follows.update({
      where: {
        followerId_followingId: {
          followerId: actorId,
          followingId: user.id
        }
      },
      data: { status: 'ACCEPTED' }
    });

    // Change the original FOLLOW_REQUEST notification to FOLLOW instead of deleting it
    await prisma.notification.update({
      where: { id: notificationId },
      data: { type: 'FOLLOW' }
    });

    // Create a new notification for the original requester
    await prisma.notification.create({
      data: {
        userId: actorId,
        actorId: user.id,
        type: 'REQUEST_ACCEPTED'
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Accept API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
