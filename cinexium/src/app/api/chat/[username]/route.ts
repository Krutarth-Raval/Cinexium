import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const targetUser = await prisma.user.findUnique({ where: { username } });
    if (!targetUser) return NextResponse.json({ error: 'Target user not found' }, { status: 404 });

    // Find conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: user.id, user2Id: targetUser.id },
          { user1Id: targetUser.id, user2Id: user.id }
        ]
      }
    });

    if (!conversation) {
      // Return empty array if no conversation yet, but include target user
      return NextResponse.json({ 
        conversation: { isMuted: false, isHidden: false }, 
        messages: [],
        targetUser: { id: targetUser.id, username: targetUser.username, name: targetUser.name, avatar: targetUser.avatar },
        currentUser: { id: user.id, username: user.username, name: user.name, avatar: user.avatar }
      });
    }

    const isUser1 = conversation.user1Id === user.id;

    // Mark unread messages from target user as read
    await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        senderId: targetUser.id,
        isRead: false
      },
      data: { isRead: true }
    });

    // Fetch messages
    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversation.id,
        // Only return messages not deleted by this user
        ...(isUser1 
            ? { OR: [{ senderId: user.id, isDeletedBySender: false }, { senderId: targetUser.id, isDeletedByReceiver: false }] }
            : { OR: [{ senderId: user.id, isDeletedBySender: false }, { senderId: targetUser.id, isDeletedByReceiver: false }] }
        )
      },
      include: {
        reactions: { include: { user: { select: { id: true, name: true, username: true, avatar: true } } } }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    const settings = {
      isMuted: isUser1 ? conversation.isMutedByUser1 : conversation.isMutedByUser2,
      isHidden: isUser1 ? conversation.isHiddenByUser1 : conversation.isHiddenByUser2,
    };

    return NextResponse.json({ 
      conversation: settings, 
      messages,
      targetUser: { id: targetUser.id, username: targetUser.username, name: targetUser.name, avatar: targetUser.avatar },
      currentUser: { id: user.id, username: user.username, name: user.name, avatar: user.avatar }
    });
  } catch (error) {
    console.error('Chat messages GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const targetUser = await prisma.user.findUnique({ where: { username } });
    if (!targetUser) return NextResponse.json({ error: 'Target user not found' }, { status: 404 });

    // Check if either user has blocked the other
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: user.id, blockedId: targetUser.id },
          { blockerId: targetUser.id, blockedId: user.id }
        ]
      }
    });

    if (block) {
      return NextResponse.json({ error: 'Cannot send message to this user' }, { status: 403 });
    }

    const { content } = await req.json();

    // Get or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: user.id, user2Id: targetUser.id },
          { user1Id: targetUser.id, user2Id: user.id }
        ]
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id: user.id,
          user2Id: targetUser.id
        }
      });
    }

    // Unhide the conversation for both users if they were hidden
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        isHiddenByUser1: false,
        isHiddenByUser2: false
      }
    });

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        content
      }
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Chat POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const targetUser = await prisma.user.findUnique({ where: { username } });
    if (!targetUser) return NextResponse.json({ error: 'Target user not found' }, { status: 404 });

    const conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: user.id, user2Id: targetUser.id },
          { user1Id: targetUser.id, user2Id: user.id }
        ]
      }
    });

    if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    const { action } = await req.json();
    const isUser1 = conversation.user1Id === user.id;

    if (action === 'mute') {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: isUser1 ? { isMutedByUser1: true } : { isMutedByUser2: true }
      });
    } else if (action === 'unmute') {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: isUser1 ? { isMutedByUser1: false } : { isMutedByUser2: false }
      });
    } else if (action === 'hide') {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: isUser1 ? { isHiddenByUser1: true } : { isHiddenByUser2: true }
      });
    } else if (action === 'unhide') {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: isUser1 ? { isHiddenByUser1: false } : { isHiddenByUser2: false }
      });
    } else if (action === 'delete') {
      // Mark all messages as deleted by this user
      await prisma.message.updateMany({
        where: { conversationId: conversation.id, senderId: user.id },
        data: { isDeletedBySender: true }
      });
      await prisma.message.updateMany({
        where: { conversationId: conversation.id, senderId: targetUser.id },
        data: { isDeletedByReceiver: true }
      });
      // Optionally hide it
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: isUser1 ? { isHiddenByUser1: true } : { isHiddenByUser2: true }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chat PATCH Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
