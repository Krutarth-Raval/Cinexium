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

    if (action === 'sendMessage') {
      const { targetUserId, content } = data;
      const senderId = user.id;

      // 1. Check if block exists
      const block = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: senderId, blockedId: targetUserId },
            { blockerId: targetUserId, blockedId: senderId }
          ]
        }
      });
      if (block) return NextResponse.json({ error: 'Cannot send message' }, { status: 403 });

      // 2. Get or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: {
          OR: [
            { user1Id: senderId, user2Id: targetUserId },
            { user1Id: targetUserId, user2Id: senderId }
          ]
        }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { user1Id: senderId, user2Id: targetUserId }
        });
      }

      // Unhide conversation
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { isHiddenByUser1: false, isHiddenByUser2: false }
      });

      // 3. Save message
      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: senderId,
          content: content
        }
      });

      // 4. Trigger Pusher events
      await pusherServer.trigger(`user-${targetUserId}`, 'receiveMessage', { message });
      // We also trigger to the sender so other tabs update
      await pusherServer.trigger(`user-${senderId}`, 'messageSent', { message });

      return NextResponse.json({ success: true, message });
    }

    if (action === 'editMessage') {
      const { messageId, content, targetUserId } = data;
      const message = await prisma.message.update({
        where: { id: messageId },
        data: { content: content, isEdited: true }
      });
      
      await pusherServer.trigger(`user-${targetUserId}`, 'messageUpdated', { message });
      await pusherServer.trigger(`user-${user.id}`, 'messageUpdated', { message });
      
      return NextResponse.json({ success: true, message });
    }

    if (action === 'deleteMessageForEveryone') {
      const { messageId, targetUserId } = data;
      const message = await prisma.message.update({
        where: { id: messageId },
        data: { isDeletedForEveryone: true, content: 'This message was deleted' },
        include: { reactions: { include: { user: { select: { id: true, name: true, username: true, avatar: true } } } } }
      });
      // Also delete reactions
      await prisma.messageReaction.deleteMany({ where: { messageId } });
      
      await pusherServer.trigger(`user-${targetUserId}`, 'messageUpdated', { message });
      await pusherServer.trigger(`user-${user.id}`, 'messageUpdated', { message });
      
      return NextResponse.json({ success: true, message });
    }

    if (action === 'reactMessage') {
      const { messageId, reaction, targetUserId } = data;
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
