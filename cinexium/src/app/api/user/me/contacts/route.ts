import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [followings, followers] = await Promise.all([
      prisma.follows.findMany({
        where: { followerId: user.id, status: 'ACCEPTED' },
        include: {
          following: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              isPremium: true,
            }
          }
        }
      }),
      prisma.follows.findMany({
        where: { followingId: user.id, status: 'ACCEPTED' },
        include: {
          follower: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              isPremium: true,
            }
          }
        }
      })
    ]);

    const uniqueUsers = new Map<string, {
      id: string;
      name: string;
      username: string;
      avatar: string | null;
      isPremium: boolean;
    }>();

    followings.forEach((follow) => {
      uniqueUsers.set(follow.following.id, follow.following);
    });

    followers.forEach((follow) => {
      uniqueUsers.set(follow.follower.id, follow.follower);
    });

    // Keep returning `follower` for compatibility with existing chat UIs.
    const mapped = Array.from(uniqueUsers.values()).map((contact) => ({ follower: contact }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
