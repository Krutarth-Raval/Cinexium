import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';
import { applyRateLimit, enforceSameOrigin, getClientIp, MAX_MESSAGE_LENGTH, normalizeText } from '@/lib/security';

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
    const originError = enforceSameOrigin(req);
    if (originError) return originError;

    const rateLimit = applyRateLimit({
      key: `chat-message:${user.id}:${getClientIp(req)}`,
      limit: 30,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'You are sending messages too quickly.' }, { status: 429 });
    }

    const data = await req.json();
    const { action } = data;

    if (action === 'sendMessage') {
      const targetUserId = normalizeText(data.targetUserId, 64);
      const content = normalizeText(data.content, MAX_MESSAGE_LENGTH);
      const senderId = user.id;

      if (!targetUserId || !content) {
        return NextResponse.json({ error: 'Target user and content are required' }, { status: 400 });
      }

      const block = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: senderId, blockedId: targetUserId },
            { blockerId: targetUserId, blockedId: senderId }
          ]
        }
      });
      if (block) return NextResponse.json({ error: 'Cannot send message' }, { status: 403 });

      const [user1Id, user2Id] = [senderId, targetUserId].sort();

      let conversation = await prisma.conversation.findFirst({
        where: {
          OR: [
            { user1Id, user2Id },
            { user1Id: senderId, user2Id: targetUserId },
            { user1Id: targetUserId, user2Id: senderId }
          ]
        }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { user1Id, user2Id }
        });
      }

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: conversation.user1Id === senderId
          ? { isHiddenByUser1: false, isHiddenByUser2: false }
          : { isHiddenByUser1: false, isHiddenByUser2: false }
      });

      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: senderId,
          content: content
        }
      });

      await pusherServer.trigger(`user-${targetUserId}`, 'receiveMessage', { message });
      await pusherServer.trigger(`user-${senderId}`, 'messageSent', { message });

      return NextResponse.json({ success: true, message });
    }

    if (action === 'editMessage') {
      const messageId = normalizeText(data.messageId, 64);
      const content = normalizeText(data.content, MAX_MESSAGE_LENGTH);
      if (!messageId || !content) {
        return NextResponse.json({ error: 'Message ID and content are required' }, { status: 400 });
      }

      const existingMessage = await prisma.message.findUnique({
        where: { id: messageId },
        include: { conversation: true },
      });

      if (!existingMessage) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }

      const isParticipant =
        existingMessage.conversation.user1Id === user.id || existingMessage.conversation.user2Id === user.id;
      if (!isParticipant || existingMessage.senderId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const message = await prisma.message.update({
        where: { id: messageId },
        data: { content: content, isEdited: true }
      });

      const targetUserId =
        existingMessage.conversation.user1Id === user.id
          ? existingMessage.conversation.user2Id
          : existingMessage.conversation.user1Id;
      
      await pusherServer.trigger(`user-${targetUserId}`, 'messageUpdated', { message });
      await pusherServer.trigger(`user-${user.id}`, 'messageUpdated', { message });
      
      return NextResponse.json({ success: true, message });
    }

    if (action === 'deleteMessageForEveryone') {
      const messageId = normalizeText(data.messageId, 64);
      if (!messageId) {
        return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
      }

      const existingMessage = await prisma.message.findUnique({
        where: { id: messageId },
        include: { conversation: true },
      });

      if (!existingMessage) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }

      const isParticipant =
        existingMessage.conversation.user1Id === user.id || existingMessage.conversation.user2Id === user.id;
      if (!isParticipant || existingMessage.senderId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const message = await prisma.message.update({
        where: { id: messageId },
        data: { isDeletedForEveryone: true, content: 'This message was deleted' },
        include: { reactions: { include: { user: { select: { id: true, name: true, username: true, avatar: true } } } } }
      });
      await prisma.messageReaction.deleteMany({ where: { messageId } });

      const targetUserId =
        existingMessage.conversation.user1Id === user.id
          ? existingMessage.conversation.user2Id
          : existingMessage.conversation.user1Id;
      
      await pusherServer.trigger(`user-${targetUserId}`, 'messageUpdated', { message });
      await pusherServer.trigger(`user-${user.id}`, 'messageUpdated', { message });
      
      return NextResponse.json({ success: true, message });
    }

    if (action === 'reactMessage') {
      const messageId = normalizeText(data.messageId, 64);
      const reaction = normalizeText(data.reaction, 16);
      if (!messageId || !reaction) {
        return NextResponse.json({ error: 'Message ID and reaction are required' }, { status: 400 });
      }

      const existingMessage = await prisma.message.findUnique({
        where: { id: messageId },
        include: { conversation: true },
      });

      if (!existingMessage) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }

      const isParticipant =
        existingMessage.conversation.user1Id === user.id || existingMessage.conversation.user2Id === user.id;
      if (!isParticipant) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      await prisma.messageReaction.upsert({
        where: { messageId_userId: { messageId: messageId, userId: user.id } },
        update: { emoji: reaction },
        create: { messageId: messageId, userId: user.id, emoji: reaction }
      });

      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: { reactions: { include: { user: { select: { id: true, name: true, username: true, avatar: true } } } } }
      });
      
      if (message) {
        const targetUserId =
          existingMessage.conversation.user1Id === user.id
            ? existingMessage.conversation.user2Id
            : existingMessage.conversation.user1Id;
        await pusherServer.trigger(`user-${targetUserId}`, 'messageUpdated', { message });
        await pusherServer.trigger(`user-${user.id}`, 'messageUpdated', { message });
      }
      return NextResponse.json({ success: true, message });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('API Chat Message Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
