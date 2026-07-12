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

    const { actorId, notificationId, communityId } = await req.json();

    const group = await prisma.groupChat.findUnique({
      where: { id: communityId },
      include: { members: true }
    });

    if (!group || group.ownerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Add user to community as MEMBER
    const existingMember = group.members.find(m => m.userId === actorId);
    if (!existingMember) {
      await prisma.groupMember.create({
        data: {
          groupId: communityId,
          userId: actorId,
          role: 'MEMBER'
        }
      });
    }

    // Accept request
    await prisma.communityJoinRequest.updateMany({
      where: {
        communityId: communityId,
        userId: actorId,
      },
      data: { status: 'ACCEPTED' }
    });

    // Delete the notification
    if (notificationId) {
      await prisma.notification.delete({
        where: { id: notificationId }
      }).catch(() => {});
    }

    // Notify user that request was accepted
    await prisma.notification.create({
      data: {
        userId: actorId,
        actorId: user.id,
        type: 'COMMUNITY_JOIN_ACCEPTED',
        referenceId: communityId,
        referenceType: 'community'
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Accept Community Request Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
