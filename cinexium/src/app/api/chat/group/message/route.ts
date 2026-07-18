import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { getGroupChannelName, pusherServer } from '@/lib/pusher';
import { logPushDebug } from '@/lib/push/debug';
import { createPushNotification } from '@/lib/push/service';
import { applyRateLimit, enforceSameOrigin, getClientIp, MAX_MESSAGE_LENGTH, normalizeText } from '@/lib/security';
import { syncExpiredSubscriptionForUser } from '@/lib/subscriptions';

const normalizeGifField = (value: unknown) =>
  typeof value === 'string' ? value.trim().slice(0, 2048) : '';

function extractMentions(content: string) {
  const matches = content.matchAll(/@([a-z0-9_.]{3,24})/gi);
  return new Set(Array.from(matches, (match) => match[1].toLowerCase()));
}

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

    await syncExpiredSubscriptionForUser(user.id);
    const refreshedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, username: true, avatar: true, isPremium: true },
    });

    if (!refreshedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const rateLimit = applyRateLimit({
      key: `group-message:${refreshedUser.id}:${getClientIp(req)}`,
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
      const gifId = normalizeGifField(data.gifId).slice(0, 128) || null;
      const gifUrl = normalizeGifField(data.gifUrl) || null;

      if (!groupId || (!content && !gifId && !gifUrl)) {
        return NextResponse.json({ error: 'Group and a message or GIF are required' }, { status: 400 });
      }

      if ((gifId && !gifUrl) || (!gifId && gifUrl)) {
        return NextResponse.json({ error: 'GIF ID and URL must be provided together' }, { status: 400 });
      }

      const group = await prisma.groupChat.findUnique({
        where: { id: groupId },
        include: { members: { where: { userId: refreshedUser.id } } }
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
        
        if (permission === 'PREMIUM_ONLY' && role !== 'ADMIN' && !refreshedUser.isPremium) {
          return NextResponse.json({ error: 'Only Pro users and admins can send messages in this community' }, { status: 403 });
        }
      }

      const message = await prisma.groupMessage.create({
        data: {
          groupId: groupId,
          senderId: refreshedUser.id,
          content: content,
          gifId,
          gifUrl,
        },
        include: { sender: { select: { id: true, username: true, name: true, avatar: true } }, reactions: true }
      });
      
      await pusherServer.trigger(getGroupChannelName(groupId), 'receiveGroupMessage', { message });

      const fullGroup = await prisma.groupChat.findUnique({
        where: { id: groupId },
        select: {
          id: true,
          name: true,
          isCommunity: true,
          members: {
            select: {
              userId: true,
              user: { select: { username: true } },
            },
          },
        },
      });

      if (fullGroup) {
        const mentions = extractMentions(content);
        const recipients = fullGroup.members.filter((member) => member.userId !== refreshedUser.id);

        await Promise.all(
          recipients.map(async (member) => {
            const username = member.user.username.toLowerCase();
            const isMention = mentions.has(username);

            if (fullGroup.isCommunity && !isMention) {
              return;
            }

            const eventKey = `group:${message.id}:${member.userId}`;
            logPushDebug({
              eventKey,
              source: 'message',
              type: fullGroup.isCommunity
                ? 'COMMUNITY_MENTION'
                : isMention
                  ? 'GROUP_MENTION'
                  : 'GROUP_MESSAGE',
              userId: member.userId,
              step: 'message_created',
              data: {
                messageId: message.id,
                groupId,
                senderId: refreshedUser.id,
                recipientUserId: member.userId,
                isMention,
                isCommunity: fullGroup.isCommunity,
              },
            });

            await createPushNotification({
              userId: member.userId,
              actor: refreshedUser,
              actorId: refreshedUser.id,
              type: fullGroup.isCommunity
                ? 'COMMUNITY_MENTION'
                : isMention
                  ? 'GROUP_MENTION'
                  : 'GROUP_MESSAGE',
              title: fullGroup.isCommunity
                ? `${refreshedUser.name} mentioned you in ${fullGroup.name}`
                : `${fullGroup.name}`,
              body: content || (gifUrl ? 'Sent a GIF' : 'Sent a message'),
              deepLink: `/chat/group/${groupId}`,
              eventKey,
              tag: `chat:group:${groupId}`,
              createInApp: false,
              debugSource: 'message',
              suppressWhenActive: {
                pageType: 'group',
                pageTargetId: groupId,
              },
            });
          })
        );
      }
      
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
        data: { isDeletedForEveryone: true, content: 'This message was deleted', gifId: null, gifUrl: null },
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
