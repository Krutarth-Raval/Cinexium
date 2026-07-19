import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { getUserChannelName, pusherServer } from '@/lib/pusher';
import { logPushDebug } from '@/lib/push/debug';
import { getMessagePreview, parseStructuredMessage } from '@/lib/push/message-preview';
import { clearPushNotificationsForUser, createPushNotification } from '@/lib/push/service';
import { applyRateLimit, enforceSameOrigin, getClientIp, MAX_MESSAGE_LENGTH, normalizeText } from '@/lib/security';

const normalizeGifField = (value: unknown) =>
  typeof value === 'string' ? value.trim().slice(0, 2048) : '';

async function emitReceiptUpdate(params: {
  recipientUserId: string;
  messageIds: string[];
  deliveredAt?: string | null;
  isRead?: boolean;
}) {
  if (params.messageIds.length === 0) {
    return;
  }

  await pusherServer.trigger(getUserChannelName(params.recipientUserId), 'messageReceiptUpdated', {
    messageIds: params.messageIds,
    deliveredAt: params.deliveredAt ?? null,
    isRead: Boolean(params.isRead),
  });
}

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
      const gifId = normalizeGifField(data.gifId).slice(0, 128) || null;
      const gifUrl = normalizeGifField(data.gifUrl) || null;
      const senderId = user.id;

      if (!targetUserId || (!content && !gifId && !gifUrl)) {
        return NextResponse.json({ error: 'Target user and a message or GIF are required' }, { status: 400 });
      }

      if ((gifId && !gifUrl) || (!gifId && gifUrl)) {
        return NextResponse.json({ error: 'GIF ID and URL must be provided together' }, { status: 400 });
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
          content: content,
          gifId,
          gifUrl,
        }
      });

      await pusherServer.trigger(getUserChannelName(targetUserId), 'receiveMessage', { message });
      await pusherServer.trigger(getUserChannelName(senderId), 'messageSent', { message });

      const structured = parseStructuredMessage(content);
      const messagePreview = getMessagePreview({
        content,
        gifUrl,
        structured,
      });
      const dmTag = `chat:dm:${conversation.id}`;
      const baseEventKey = structured?.kind === 'GROUP_INVITE' && structured.meta?.groupId
        ? `invite:${message.id}:${targetUserId}`
        : structured?.kind === 'COLLECTION_SHARE' && structured.meta?.collectionId
          ? `collection-share:${message.id}:${targetUserId}`
          : `dm:${message.id}:${targetUserId}`;

      logPushDebug({
        eventKey: baseEventKey,
        source: 'message',
        type: structured?.kind === 'GROUP_INVITE'
          ? 'GROUP_INVITE'
          : structured?.kind === 'COLLECTION_SHARE'
            ? 'COLLECTION_SHARE'
            : 'DIRECT_MESSAGE',
        userId: targetUserId,
        step: 'message_created',
        data: {
          messageId: message.id,
          conversationId: conversation.id,
          senderId: senderId,
          targetUserId,
          structuredKind: structured?.kind ?? null,
        },
      });

      if (!(
        (conversation.user1Id === targetUserId && conversation.isMutedByUser1) ||
        (conversation.user2Id === targetUserId && conversation.isMutedByUser2)
      )) {
        if (structured?.kind === 'GROUP_INVITE' && structured.meta?.groupId) {
          const targetGroup = await prisma.groupChat.findUnique({
            where: { id: String(structured.meta.groupId) },
            select: { isCommunity: true, name: true },
          });

          const inviteKind = targetGroup?.isCommunity ? 'COMMUNITY_INVITE' : 'GROUP_INVITE';
          const invitePreview = targetGroup?.isCommunity ? 'Shared a community' : 'Shared a group';

          await createPushNotification({
            userId: targetUserId,
            actor: user,
            actorId: user.id,
            type: inviteKind,
            title: user.name || `@${user.username}`,
            body: invitePreview,
            deepLink: `/chat/group/${structured.meta.groupId}`,
            image: structured.meta.groupAvatar || null,
            eventKey: `invite:${message.id}:${targetUserId}`,
            tag: `invite:${structured.meta.groupId}`,
            createInApp: false,
            debugSource: 'message',
            suppressWhenActive: {
              pageType: 'group',
              pageTargetId: String(structured.meta.groupId),
            },
          });
        } else if (structured?.kind === 'COLLECTION_SHARE' && structured.meta?.collectionId) {
          await createPushNotification({
            userId: targetUserId,
            actor: user,
            actorId: user.id,
            type: 'COLLECTION_SHARE',
            title: user.name || `@${user.username}`,
            body: messagePreview,
            deepLink: structured.meta.shareUrlPath || `/collection/${structured.meta.collectionId}`,
            image: structured.meta.collectionThumbnail || null,
            eventKey: `collection-share:${message.id}:${targetUserId}`,
            tag: `collection:${structured.meta.collectionId}`,
            createInApp: false,
            debugSource: 'message',
            suppressWhenActive: {
              pageType: 'collection',
              pageTargetId: String(structured.meta.collectionId),
            },
          });
        } else {
          await createPushNotification({
            userId: targetUserId,
            actor: user,
            actorId: user.id,
            type: 'DIRECT_MESSAGE',
            title: user.name || `@${user.username}`,
            body: messagePreview,
            deepLink: `/chat/${user.username}`,
            image: null,
            eventKey: `dm:${message.id}:${targetUserId}`,
            tag: dmTag,
            createInApp: false,
            debugSource: 'message',
            suppressWhenActive: {
              pageType: 'chat',
              pageTargetId: user.username,
            },
          });
        }
      } else {
        logPushDebug({
          eventKey: baseEventKey,
          source: 'message',
          type: structured?.kind === 'GROUP_INVITE'
            ? 'GROUP_INVITE'
            : structured?.kind === 'COLLECTION_SHARE'
              ? 'COLLECTION_SHARE'
              : 'DIRECT_MESSAGE',
          userId: targetUserId,
          step: 'push_skipped',
          data: {
            reason: 'conversation_muted',
            conversationId: conversation.id,
          },
        });
      }

      return NextResponse.json({ success: true, message });
    }

    if (action === 'markDelivered' || action === 'markRead') {
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
      if (!isParticipant) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (existingMessage.senderId === user.id) {
        return NextResponse.json({ error: 'Cannot update your own receipt status' }, { status: 400 });
      }

      const deliveredTimestamp = existingMessage.deliveredAt ?? new Date();
      const nextMessage = await prisma.message.update({
        where: { id: messageId },
        data: action === 'markRead'
          ? {
              deliveredAt: deliveredTimestamp,
              isRead: true,
            }
          : {
              deliveredAt: deliveredTimestamp,
            },
      });

      await emitReceiptUpdate({
        recipientUserId: existingMessage.senderId,
        messageIds: [existingMessage.id],
        deliveredAt: nextMessage.deliveredAt?.toISOString() ?? null,
        isRead: nextMessage.isRead,
      });

      if (action === 'markRead') {
        await clearPushNotificationsForUser({
          userId: user.id,
          tag: `chat:dm:${existingMessage.conversationId}`,
        });
      }

      return NextResponse.json({ success: true, message: nextMessage });
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
      
      await pusherServer.trigger(getUserChannelName(targetUserId), 'messageUpdated', { message });
      await pusherServer.trigger(getUserChannelName(user.id), 'messageUpdated', { message });
      
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
        data: { isDeletedForEveryone: true, content: 'This message was deleted', gifId: null, gifUrl: null },
        include: { reactions: { include: { user: { select: { id: true, name: true, username: true, avatar: true } } } } }
      });
      await prisma.messageReaction.deleteMany({ where: { messageId } });

      const targetUserId =
        existingMessage.conversation.user1Id === user.id
          ? existingMessage.conversation.user2Id
          : existingMessage.conversation.user1Id;
      
      await pusherServer.trigger(getUserChannelName(targetUserId), 'messageUpdated', { message });
      await pusherServer.trigger(getUserChannelName(user.id), 'messageUpdated', { message });
      
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
        await pusherServer.trigger(getUserChannelName(targetUserId), 'messageUpdated', { message });
        await pusherServer.trigger(getUserChannelName(user.id), 'messageUpdated', { message });
      }
      return NextResponse.json({ success: true, message });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('API Chat Message Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
