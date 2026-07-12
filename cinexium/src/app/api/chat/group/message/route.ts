import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, username: true, avatar: true },
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  try {
    const data = await req.json();
    const { action } = data;

    if (action === 'sendGroupMessage') {
      const { groupId, content } = data;

      const group = await prisma.groupChat.findUnique({
        where: { id: groupId },
        include: { members: { where: { userId: user.id } } }
      });

      if (!group || group.members.length === 0) {
        return NextResponse.json({ error: 'Not a member' }, { status: 403 });
      }

      if (group.isCommunity && group.members[0].role !== 'ADMIN') {
        return NextResponse.json({ error: 'Only admins can send messages in a community' }, { status: 403 });
      }

      const message = await prisma.groupMessage.create({
        data: {
          groupId: groupId,
          senderId: user.id,
          content: content
        },
        include: { sender: { select: { id: true, username: true, name: true, avatar: true } }, reactions: true }
      });
      
      await pusherServer.trigger(`group-${groupId}`, 'receiveGroupMessage', { message });
      
      return NextResponse.json({ success: true, message });
    }

    if (action === 'editGroupMessage') {
      const { messageId, groupId, content } = data;

      const message = await prisma.groupMessage.update({
        where: { id: messageId },
        data: { content: content, isEdited: true },
        include: { sender: { select: { id: true, username: true, name: true, avatar: true } }, reactions: { include: { user: { select: { id: true, name: true, username: true, avatar: true } } } } }
      });
      
      await pusherServer.trigger(`group-${groupId}`, 'groupMessageUpdated', { message });
      
      return NextResponse.json({ success: true, message });
    }

    if (action === 'deleteGroupMessage') {
      const { messageId, groupId } = data;

      const message = await prisma.groupMessage.update({
        where: { id: messageId },
        data: { isDeletedForEveryone: true, content: 'This message was deleted' },
        include: { sender: { select: { id: true, username: true, name: true, avatar: true } }, reactions: { include: { user: { select: { id: true, name: true, username: true, avatar: true } } } } }
      });
      await prisma.groupMessageReaction.deleteMany({ where: { messageId } });
      
      await pusherServer.trigger(`group-${groupId}`, 'groupMessageUpdated', { message });
      
      return NextResponse.json({ success: true, message });
    }

    if (action === 'reactGroupMessage') {
      const { messageId, groupId, reaction } = data;

      await prisma.groupMessageReaction.upsert({
        where: { messageId_userId: { messageId: messageId, userId: user.id } },
        update: { emoji: reaction },
        create: { messageId: messageId, userId: user.id, emoji: reaction }
      });

      const message = await prisma.groupMessage.findUnique({
        where: { id: messageId },
        include: { sender: { select: { id: true, username: true, name: true, avatar: true } }, reactions: { include: { user: { select: { id: true, name: true, username: true, avatar: true } } } } }
      });
      
      if (message) {
        await pusherServer.trigger(`group-${groupId}`, 'groupMessageUpdated', { message });
      }
      return NextResponse.json({ success: true, message });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('API Group Message Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
