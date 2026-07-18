import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, username: true }
    });

    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!currentUser || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (currentUser.id === targetUser.id) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 });
    }

    await prisma.follows.deleteMany({
      where: {
        followerId: targetUser.id,
        followingId: currentUser.id
      }
    });

    await prisma.notification.deleteMany({
      where: {
        userId: currentUser.id,
        actorId: targetUser.id,
        type: { in: ['FOLLOW', 'FOLLOW_REQUEST'] }
      }
    });

    revalidatePath(`/profile/${currentUser.username}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove Follower API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
