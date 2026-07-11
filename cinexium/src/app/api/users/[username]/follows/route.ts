import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const session = await getServerSession(authOptions);

    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get followers
    const followersData = await prisma.follows.findMany({
      where: {
        followingId: targetUser.id,
        status: 'ACCEPTED'
      },
      include: {
        follower: {
          select: { id: true, name: true, username: true, avatar: true, isPrivate: true }
        }
      }
    });

    // Get following
    const followingData = await prisma.follows.findMany({
      where: {
        followerId: targetUser.id,
        status: 'ACCEPTED'
      },
      include: {
        following: {
          select: { id: true, name: true, username: true, avatar: true, isPrivate: true }
        }
      }
    });

    let followers = followersData.map(f => f.follower);
    let following = followingData.map(f => f.following);

    // If logged in, check if current user follows them
    if (session?.user?.email) {
      const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      });

      if (currentUser) {
        const myFollows = await prisma.follows.findMany({
          where: {
            followerId: currentUser.id,
          },
          select: { followingId: true, status: true }
        });

        const followStatusMap = new Map(myFollows.map(f => [f.followingId, f.status]));

        followers = followers.map(u => ({
          ...u,
          followStatus: followStatusMap.get(u.id) || 'NONE',
          isMe: u.id === currentUser.id
        }));

        following = following.map(u => ({
          ...u,
          followStatus: followStatusMap.get(u.id) || 'NONE',
          isMe: u.id === currentUser.id
        }));
      }
    } else {
        followers = followers.map(u => ({ ...u, followStatus: 'NONE', isMe: false }));
        following = following.map(u => ({ ...u, followStatus: 'NONE', isMe: false }));
    }

    return NextResponse.json({ followers, following });
  } catch (error) {
    console.error('Error fetching follows:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
