import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { getGroupChannelName, pusherServer } from '@/lib/pusher';
import { applyRateLimit, enforceSameOrigin, getClientIp, MAX_MESSAGE_LENGTH, normalizeText } from '@/lib/security';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, username: true, avatar: true, isPremium: true },
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  try {
    const originError = enforceSameOrigin(req);
    if (originError) return originError;

    const rateLimit = applyRateLimit({
      key: `group-message:${user.id}:${getClientIp(req)}`,
      limit: 30,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'You are sending messages too quickly.' }, { status: 429 });
    }

    const data = await req.json();
    const { action } = data;

    if (action === 'sendGroupMessage') {
      const groupId = normalizeText(data.groupId, 64);
      const content = normalizeText(data.content, MAX_MESSAGE_LENGTH);

      if (!groupId || !content) {
        return NextResponse.json({ error: 'Group and content are required' }, { status: 400 });
      }

      const group = await prisma.groupChat.findUnique({
        where: { id: groupId },
        include: { members: { where: { userId: user.id } } }
      });

      if (!group || group.members.length === 0) {
        return NextResponse.json({ error: 'Not a member' }, { status: 403 });
      }

      if (group.isCommunity) {
        const role = group.members[0].role;
        const permission = group.messagePermission || 'ALL';
        
        if (permission === 'ADMIN_ONLY' && role !== 'ADMIN') {
          return NextResponse.json({ error: 'Only admins can send messages in this community' }, { status: 403 });
        }
        
        if (permission === 'PREMIUM_ONLY' && role !== 'ADMIN' && !user.isPremium) {
          return NextResponse.json({ error: 'Only Pro users and admins can send messages in this community' }, { status: 403 });
        }
      }

      const message = await prisma.groupMessage.create({
        data: {
          groupId: groupId,
          senderId: user.id,
          content: content
        },
        include: { sender: { select: { id: true, username: true, name: true, avatar: true } }, reactions: true }
      });
      
      await pusherServer.trigger(getGroupChannelName(groupId), 'receiveGroupMessage', { message });
      
      return NextResponse.json({ success: true, message });
    }

    if (action === 'editGroupMessage') {
      const messageId = normalizeText(data.messageId, 64);
      const groupId = normalizeText(data.groupId, 64);
      const content = normalizeText(data.content, MAX_MESSAGE_LENGTH);
      if (!messageId || !groupId || !content) {
        return NextResponse.json({ error: 'Message, group, and content are required' }, { status: 400 });
      }

      const existingMessage = await prisma.groupMessage.findUnique({
        where: { id: messageId },
      });

      if (!existingMessage || existingMessage.groupId !== groupId) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }

      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: user.id } }
      });

      if (!membership || existingMessage.senderId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const message = await prisma.groupMessage.update({
        where: { id: messageId },
        data: { content: content, isEdited: true },
        include: { sender: { select: { id: true, username: true, name: true, avatar: true } }, reactions: { include: { user: { select: { id: true, name: true, username: true, avatar: true } } } } }
      });
      
      await pusherServer.trigger(getGroupChannelName(groupId), 'groupMessageUpdated', { message });
      
      return NextResponse.json({ success: true, message });
    }

    if (action === 'deleteGroupMessage') {
      const messageId = normalizeText(data.messageId, 64);
      const groupId = normalizeText(data.groupId, 64);
      if (!messageId || !groupId) {
        return NextResponse.json({ error: 'Message and group are required' }, { status: 400 });
      }

      const existingMessage = await prisma.groupMessage.findUnique({
        where: { id: messageId },
      });

      if (!existingMessage || existingMessage.groupId !== groupId) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }

      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: user.id } }
      });

      if (!membership || existingMessage.senderId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const message = await prisma.groupMessage.update({
        where: { id: messageId },
        data: { isDeletedForEveryone: true, content: 'This message was deleted' },
        include: { sender: { select: { id: true, username: true, name: true, avatar: true } }, reactions: { include: { user: { select: { id: true, name: true, username: true, avatar: true } } } } }
      });
      await prisma.groupMessageReaction.deleteMany({ where: { messageId } });
      
      await pusherServer.trigger(getGroupChannelName(groupId), 'groupMessageUpdated', { message });
      
      return NextResponse.json({ success: true, message });
    }

    if (action === 'reactGroupMessage') {
      const messageId = normalizeText(data.messageId, 64);
      const groupId = normalizeText(data.groupId, 64);
      const reaction = normalizeText(data.reaction, 16);
      if (!messageId || !groupId || !reaction) {
        return NextResponse.json({ error: 'Message, group, and reaction are required' }, { status: 400 });
      }

      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: user.id } }
      });

      if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

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
        await pusherServer.trigger(getGroupChannelName(groupId), 'groupMessageUpdated', { message });
      }
      return NextResponse.json({ success: true, message });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('API Group Message Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
