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

    await prisma.follows.delete({
      where: {
        followerId_followingId: {
          followerId: actorId,
          followingId: user.id
        }
      }
    });

    await prisma.notification.delete({
      where: { id: notificationId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reject API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
