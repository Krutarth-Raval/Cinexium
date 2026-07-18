import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { getUserChannelName, pusherServer } from '@/lib/pusher';

export async function GET(req: NextRequest) {
  const isHiddenQuery = req.nextUrl.searchParams.get('hidden') === 'true';
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const undeliveredMessages = await prisma.message.findMany({
      where: {
        senderId: { not: user.id },
        deliveredAt: null,
        isDeletedByReceiver: false,
        conversation: {
          OR: [
            { user1Id: user.id },
            { user2Id: user.id },
          ],
        },
      },
      select: {
        id: true,
        senderId: true,
      },
    });

    if (undeliveredMessages.length > 0) {
      const deliveredAt = new Date();
      await prisma.message.updateMany({
        where: {
          id: { in: undeliveredMessages.map((message) => message.id) },
        },
        data: { deliveredAt },
      });

      const groupedBySender = undeliveredMessages.reduce<Record<string, string[]>>((acc, message) => {
        if (!acc[message.senderId]) {
          acc[message.senderId] = [];
        }
        acc[message.senderId].push(message.id);
        return acc;
      }, {});

      await Promise.all(
        Object.entries(groupedBySender).map(([senderId, messageIds]) =>
          pusherServer.trigger(getUserChannelName(senderId), 'messageReceiptUpdated', {
            messageIds,
            deliveredAt: deliveredAt.toISOString(),
            isRead: false,
          })
        )
      );
    }

    // Fetch all conversations where user is either user1 or user2
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: user.id },
          { user2Id: user.id }
        ]
      },
      include: {
        user1: { select: { id: true, username: true, name: true, avatar: true } },
        user2: { select: { id: true, username: true, name: true, avatar: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get the latest message for the preview
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: user.id },
                isRead: false,
                isDeletedByReceiver: false
              }
            }
          }
        }
      }
    });

    // Fetch all GroupChats where user is a member
    const groupChats = await prisma.groupChat.findMany({
      where: {
        members: { some: { userId: user.id } }
      },
      include: {
        members: { where: { userId: user.id } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    // Filter out conversations hidden by this user (or keep ONLY hidden ones)
    const visibleConversations = conversations.filter(conv => {
      const isHidden = conv.user1Id === user.id ? conv.isHiddenByUser1 : conv.isHiddenByUser2;
      return isHiddenQuery ? isHidden : !isHidden;
    });

    // Fetch all blocks involving the current user
    const blocks = await prisma.block.findMany({
      where: {
        OR: [
          { blockerId: user.id },
          { blockedId: user.id }
        ]
      }
    });
    
    const blockedUserIds = new Set(
      blocks.flatMap(b => [b.blockerId, b.blockedId]).filter(id => id !== user.id)
    );

    const formatted = visibleConversations.map(conv => {
      const isUser1 = conv.user1Id === user.id;
      const otherUser = isUser1 ? conv.user2 : conv.user1;
      const isMuted = isUser1 ? conv.isMutedByUser1 : conv.isMutedByUser2;
      const isPinned = isUser1 ? conv.isPinnedByUser1 : conv.isPinnedByUser2;
      const latestMessage = conv.messages[0];

      let previewText = '';
      let latestMessageStatus: 'sent' | 'delivered' | 'read' | null = null;
      let latestMessageIsMine = false;
      if (latestMessage) {
        const isSender = latestMessage.senderId === user.id;
        latestMessageIsMine = isSender;
        const isDeleted = isSender ? latestMessage.isDeletedBySender : latestMessage.isDeletedByReceiver;
        if (!isDeleted) {
          if (latestMessage.gifUrl) {
            previewText = '[GIF]';
          } else {
            previewText = latestMessage.content;
          }

          if (isSender) {
            latestMessageStatus = latestMessage.isRead
              ? 'read'
              : latestMessage.deliveredAt
                ? 'delivered'
                : 'sent';
          }
        }
        // We now have _count.messages for unread count
      }

      return {
        id: conv.id,
        isGroup: false,
        user: otherUser,
        isBlocked: blockedUserIds.has(otherUser.id),
        isMuted,
        isPinned,
        latestMessage: previewText,
        latestMessageIsMine,
        latestMessageStatus,
        updatedAt: conv.updatedAt,
        unreadCount: conv._count?.messages || 0,
        isContactOnly: false
      };
    });

    const visibleGroupChats = groupChats.filter(group => {
      const isHidden = group.members[0]?.isHidden || false;
      return isHiddenQuery ? isHidden : !isHidden;
    });

    const formattedGroups = visibleGroupChats.map(group => {
      const latestMessage = group.messages[0];
      let previewText = '';
      if (latestMessage) {
        if (!latestMessage.isDeletedForEveryone) {
          if (latestMessage.gifUrl) {
            previewText = '[GIF]';
          } else {
            previewText = latestMessage.content;
          }
        }
      }
      return {
        id: group.id,
        isGroup: true,
        isCommunity: group.isCommunity,
        isPremiumOnly: group.isPremiumOnly,
        user: { id: group.id, username: group.name, name: group.name, avatar: group.avatar }, // map group details to 'user' for sidebar generic rendering
        isMuted: false, // Groups don't have individual mute yet in this schema
        isPinned: group.members[0]?.isPinned || false,
        latestMessage: previewText,
        updatedAt: group.updatedAt,
        unreadCount: 0, // Could add read receipts for groups later
        isContactOnly: false
      };
    });

    // Combine
    const allChats = [...formatted, ...formattedGroups];

    // Also fetch accepted followings and followers to act as chat contacts (Skip if hidden query)
    if (isHiddenQuery) {
      return NextResponse.json(allChats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    }

    const [followings, followers] = await Promise.all([
      prisma.follows.findMany({
        where: { followerId: user.id, status: 'ACCEPTED' },
        include: { following: { select: { id: true, username: true, name: true, avatar: true } } }
      }),
      prisma.follows.findMany({
        where: { followingId: user.id, status: 'ACCEPTED' },
        include: { follower: { select: { id: true, username: true, name: true, avatar: true } } }
      })
    ]);

    // Add accepted followings/followers that don't already have an active conversation (even if hidden)
    const allKnownUserIds = new Set(conversations.map(conv => conv.user1Id === user.id ? conv.user2Id : conv.user1Id));

    const contactUsers = new Map<string, { id: string; username: string; name: string; avatar: string | null }>();
    followings.forEach((follow) => {
      contactUsers.set(follow.following.id, follow.following);
    });
    followers.forEach((follow) => {
      contactUsers.set(follow.follower.id, follow.follower);
    });

    contactUsers.forEach((contact) => {
      if (!allKnownUserIds.has(contact.id)) {
        allChats.push({
          id: `contact-${contact.id}`,
          isGroup: false,
          user: contact,
          isBlocked: false,
          isMuted: false,
          isPinned: false,
          latestMessage: 'Start a conversation',
          latestMessageIsMine: false,
          latestMessageStatus: null,
          updatedAt: new Date(0), // Push to bottom if sorting by date
          isContactOnly: true,
          unreadCount: 0
        });
      }
    });

    // Sort by latest message first
    allChats.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return NextResponse.json(allChats);
  } catch (error) {
    console.error('Chat API GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
