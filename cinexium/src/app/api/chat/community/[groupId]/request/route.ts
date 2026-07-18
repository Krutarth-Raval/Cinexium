import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { createPushNotification } from '@/lib/push/service';

export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { groupId } = await params;
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const group = await prisma.groupChat.findUnique({
      where: { id: groupId }
    });

    if (!group) return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    if (!group.isCommunity) return NextResponse.json({ error: 'Not a community' }, { status: 400 });

    // Check if request already exists
    const existing = await prisma.communityJoinRequest.findUnique({
      where: {
        communityId_userId: {
          communityId: groupId,
          userId: user.id
        }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Request already sent' }, { status: 400 });
    }

    const request = await prisma.communityJoinRequest.create({
      data: {
        communityId: groupId,
        userId: user.id
      }
    });

    // Notify the community admin
    await createPushNotification({
      userId: group.ownerId,
      actor: {
        id: user.id,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
      },
      actorId: user.id,
      type: 'COMMUNITY_JOIN_REQUEST',
      title: `${user.name} requested to join ${group.name}`,
      body: 'Review the request from your notifications.',
      deepLink: '/notifications',
      referenceId: group.id,
      referenceType: 'community',
      eventKey: `community-request:${request.id}:${group.ownerId}`,
    });

    return NextResponse.json({ success: true, request });
  } catch (error) {
    console.error('Community Request Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
