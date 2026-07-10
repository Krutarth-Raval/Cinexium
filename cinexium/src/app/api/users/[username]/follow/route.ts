import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    const targetUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!currentUser || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (currentUser.id === targetUser.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: targetUser.id,
        },
      },
    });

    if (existingFollow) {
      // Unfollow (or cancel request)
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: targetUser.id,
          },
        },
      });

      // Delete associated notification
      await prisma.notification.deleteMany({
        where: {
          userId: targetUser.id,
          actorId: currentUser.id,
          type: { in: ['FOLLOW', 'FOLLOW_REQUEST'] }
        }
      });

      return NextResponse.json({ status: 'NONE', targetUserId: targetUser.id });
    } else {
      // Follow or request
      const isPrivate = targetUser.isPrivate;
      const status = isPrivate ? 'PENDING' : 'ACCEPTED';

      await prisma.follows.create({
        data: {
          followerId: currentUser.id,
          followingId: targetUser.id,
          status,
        },
      });

      // Send notification
      await prisma.notification.create({
        data: {
          userId: targetUser.id,
          actorId: currentUser.id,
          type: isPrivate ? 'FOLLOW_REQUEST' : 'FOLLOW',
        }
      });

      return NextResponse.json({ status, targetUserId: targetUser.id });
    }
  } catch (error) {
    console.error('Follow API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
