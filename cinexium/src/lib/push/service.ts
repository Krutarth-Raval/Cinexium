import 'server-only';

import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUserChannelName, pusherServer } from '@/lib/pusher';
import { logPushDebug } from './debug';
import { getFirebaseAdminMessaging } from './firebase-admin';
import {
  PUSH_ACTIVE_WINDOW_MS,
  PUSH_BADGE_URL,
  PUSH_DEFAULT_IMAGE,
  PUSH_ICON_URL,
  PUSH_SETTING_FIELDS,
  type PresencePageType,
  type PushNotificationKind,
} from './constants';

type ActorShape = {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
};

type CreatePushNotificationInput = {
  userId: string;
  actorId?: string;
  actor?: ActorShape;
  type: PushNotificationKind;
  title: string;
  body: string;
  deepLink: string;
  image?: string | null;
  icon?: string | null;
  badge?: string | null;
  referenceId?: string | null;
  referenceType?: string | null;
  eventKey: string;
  tag?: string;
  createInApp?: boolean;
  debugSource?: string;
  suppressWhenActive?: {
    pageType: PresencePageType;
    pageTargetId: string;
  };
};

type PushDecision = {
  shouldSend: boolean;
  reason: string;
};

function toAbsolutePath(path: string | null | undefined) {
  return path || null;
}

async function getActor(actorId?: string, actor?: ActorShape): Promise<ActorShape> {
  if (actor) {
    return actor;
  }

  if (!actorId) {
    return {
      id: 'system',
      username: 'cinexium',
      name: 'Cinexium',
      avatar: null,
    };
  }

  const dbActor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { id: true, username: true, name: true, avatar: true },
  });

  if (!dbActor) {
    return {
      id: actorId,
      username: 'cinexium',
      name: 'Cinexium',
      avatar: null,
    };
  }

  return dbActor;
}

async function hasActiveResourceSession(params: {
  userId: string;
  pageType: PresencePageType;
  pageTargetId: string;
}) {
  const threshold = new Date(Date.now() - PUSH_ACTIVE_WINDOW_MS);
  const activeSession = await prisma.presenceSession.findFirst({
    where: {
      userId: params.userId,
      isVisible: true,
      isFocused: true,
      pageType: params.pageType,
      pageTargetId: params.pageTargetId,
      lastSeenAt: { gte: threshold },
    },
    select: { id: true },
  });

  return Boolean(activeSession);
}

async function sendPushPayloadToUser(
  userId: string,
  payload: Record<string, string>,
  debug: {
    eventKey: string;
    source: string;
    type: string;
  }
) {
  const messaging = getFirebaseAdminMessaging();
  if (!messaging) {
    logPushDebug({
      eventKey: debug.eventKey,
      source: debug.source,
      type: debug.type,
      userId,
      step: 'push_skipped',
      data: { reason: 'firebase_admin_unavailable' },
    });
    return;
  }

  const devices = await prisma.pushDevice.findMany({
    where: { userId },
    select: {
      token: true,
      isActive: true,
      permission: true,
      platform: true,
      browser: true,
      lastSeenAt: true,
    },
  });

  const eligibleDevices = devices.filter((device) => device.isActive && device.permission === 'granted');
  const skippedDevices = devices.filter((device) => !device.isActive || device.permission !== 'granted');

  logPushDebug({
    eventKey: debug.eventKey,
    source: debug.source,
    type: debug.type,
    userId,
    step: 'device_scan',
    data: {
      totalDevices: devices.length,
      eligibleDevices: eligibleDevices.length,
      skippedDevices: skippedDevices.length,
    },
  });

  skippedDevices.forEach((device) => {
    logPushDebug({
      eventKey: debug.eventKey,
      source: debug.source,
      type: debug.type,
      userId,
      step: 'device_skipped',
      data: {
        platform: device.platform,
        browser: device.browser,
        isActive: device.isActive,
        permission: device.permission,
        reason: !device.isActive ? 'inactive_device' : 'permission_not_granted',
      },
    });
  });

  if (eligibleDevices.length === 0) {
    logPushDebug({
      eventKey: debug.eventKey,
      source: debug.source,
      type: debug.type,
      userId,
      step: 'push_skipped',
      data: { reason: 'no_eligible_devices' },
    });
    return;
  }

  const tokens = eligibleDevices.map((device) => device.token);
  logPushDebug({
    eventKey: debug.eventKey,
    source: debug.source,
    type: debug.type,
    userId,
    step: 'fcm_request_sent',
    data: {
      tokenCount: tokens.length,
      payload,
    },
  });

  const response = await messaging.sendEachForMulticast({
    tokens,
    data: payload,
  });

  logPushDebug({
    eventKey: debug.eventKey,
    source: debug.source,
    type: debug.type,
    userId,
    step: 'firebase_response',
    data: {
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses.map((item, index) => ({
        index,
        success: item.success,
        error: item.error?.message ?? null,
        platform: eligibleDevices[index]?.platform ?? null,
        browser: eligibleDevices[index]?.browser ?? null,
      })),
    },
  });

  const invalidTokens = response.responses
    .map((item, index) => ({ item, token: tokens[index] }))
    .filter(({ item }) => !item.success)
    .map(({ token }) => token);

  if (invalidTokens.length > 0) {
    await prisma.pushDevice.updateMany({
      where: { token: { in: invalidTokens } },
      data: { isActive: false },
    });

    logPushDebug({
      eventKey: debug.eventKey,
      source: debug.source,
      type: debug.type,
      userId,
      step: 'invalid_tokens_removed',
      data: {
        count: invalidTokens.length,
      },
    });
  }

  logPushDebug({
    eventKey: debug.eventKey,
    source: debug.source,
    type: debug.type,
    userId,
    step: 'push_completed',
    data: {
      successCount: response.successCount,
      failureCount: response.failureCount,
    },
  });
}

async function shouldSendPush(
  userId: string,
  type: PushNotificationKind,
  debug: {
    eventKey: string;
    source: string;
  },
  suppressWhenActive?: {
    pageType: PresencePageType;
    pageTargetId: string;
  }
): Promise<PushDecision> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      pushNotificationsEnabled: true,
      directMessagePush: true,
      groupMessagePush: true,
      communityMentionPush: true,
      commentReplyPush: true,
      commentLikePush: true,
      groupInvitePush: true,
      communityInvitePush: true,
      followPush: true,
      collectionSharePush: true,
      watchlistReleasePush: true,
      adminAnnouncementPush: true,
    },
  });

  if (!user?.pushNotificationsEnabled) {
    return { shouldSend: false, reason: 'push_notifications_disabled' };
  }

  const settingField = PUSH_SETTING_FIELDS[type] as keyof typeof user;
  if (settingField && user[settingField] === false) {
    return { shouldSend: false, reason: `setting_disabled:${String(settingField)}` };
  }

  if (!suppressWhenActive?.pageTargetId) {
    return { shouldSend: true, reason: 'no_resource_suppression_target' };
  }

  const hasMatchingForegroundSession = await hasActiveResourceSession({
    userId,
    pageType: suppressWhenActive.pageType,
    pageTargetId: suppressWhenActive.pageTargetId,
  });

  return hasMatchingForegroundSession
    ? {
        shouldSend: false,
        reason: `suppressed_exact_resource:${suppressWhenActive.pageType}:${suppressWhenActive.pageTargetId}`,
      }
    : {
        shouldSend: true,
        reason: `no_matching_active_resource:${suppressWhenActive.pageType}:${suppressWhenActive.pageTargetId}`,
      };
}

export async function clearPushNotificationsForUser(params: {
  userId: string;
  eventKey?: string | null;
  tag?: string | null;
  notificationId?: string | null;
}) {
  await sendPushPayloadToUser(params.userId, {
    op: 'clear',
    eventKey: params.eventKey || '',
    tag: params.tag || '',
    notificationId: params.notificationId || '',
  }, {
    eventKey: params.eventKey || params.tag || params.notificationId || `clear:${params.userId}`,
    source: 'system',
    type: 'ADMIN_ANNOUNCEMENT',
  });
}

export async function markNotificationHandled(params: {
  userId: string;
  notificationId?: string | null;
  eventKey?: string | null;
}) {
  if (!params.notificationId && !params.eventKey) {
    return;
  }

  await prisma.notification.updateMany({
    where: {
      userId: params.userId,
      ...(params.notificationId ? { id: params.notificationId } : {}),
      ...(params.eventKey ? { eventKey: params.eventKey } : {}),
    },
    data: {
      isRead: true,
      handledAt: new Date(),
    },
  });
}

export async function createPushNotification(input: CreatePushNotificationInput) {
  const actor = await getActor(input.actorId, input.actor);
  const debugSource = input.debugSource || 'system';
  let notificationRecord: {
    id: string;
    eventKey: string | null;
  } | null = null;

  if (input.createInApp !== false) {
    try {
      notificationRecord = await prisma.notification.create({
        data: {
          userId: input.userId,
          actorId: actor.id === 'system' ? input.userId : actor.id,
          type: input.type,
          referenceId: input.referenceId,
          referenceType: input.referenceType,
          title: input.title,
          body: input.body,
          image: input.image,
          icon: input.icon,
          badge: input.badge,
          deepLink: input.deepLink,
          eventKey: input.eventKey,
        },
        select: {
          id: true,
          eventKey: true,
        },
      });
    } catch (error) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError | undefined;
      if (prismaError?.code !== 'P2002') {
        throw error;
      }

      notificationRecord = await prisma.notification.findFirst({
        where: {
          userId: input.userId,
          eventKey: input.eventKey,
        },
        select: {
          id: true,
          eventKey: true,
        },
      });
    }

    if (notificationRecord) {
      await pusherServer.trigger(getUserChannelName(input.userId), 'receiveNotification', {
        id: notificationRecord.id,
        type: input.type,
        actor,
        title: input.title,
        body: input.body,
        referenceId: input.referenceId,
        referenceType: input.referenceType,
        deepLink: input.deepLink,
        image: input.image,
        icon: input.icon,
        badge: input.badge,
        eventKey: input.eventKey,
      });
    }
  }

  logPushDebug({
    eventKey: input.eventKey,
    source: debugSource,
    type: input.type,
    userId: input.userId,
    step: 'push_event_generated',
    data: {
      deepLink: input.deepLink,
      tag: input.tag || input.eventKey,
      suppressWhenActive: input.suppressWhenActive ?? null,
    },
  });

  const decision = await shouldSendPush(
    input.userId,
    input.type,
    {
      eventKey: input.eventKey,
      source: debugSource,
    },
    input.suppressWhenActive
  );

  logPushDebug({
    eventKey: input.eventKey,
    source: debugSource,
    type: input.type,
    userId: input.userId,
    step: 'suppression_decision',
    data: {
      shouldSend: decision.shouldSend,
      reason: decision.reason,
    },
  });

  if (!decision.shouldSend) {
    return notificationRecord;
  }

  await sendPushPayloadToUser(input.userId, {
    op: 'show',
    title: input.title,
    body: input.body,
    icon: toAbsolutePath(input.icon) || PUSH_ICON_URL,
    image: toAbsolutePath(input.image) || PUSH_DEFAULT_IMAGE,
    badge: toAbsolutePath(input.badge) || PUSH_BADGE_URL,
    deepLink: input.deepLink,
    type: input.type,
    eventKey: input.eventKey,
    tag: input.tag || input.eventKey,
    notificationId: notificationRecord?.id || '',
    timestamp: String(Date.now()),
  }, {
    eventKey: input.eventKey,
    source: debugSource,
    type: input.type,
  });

  return notificationRecord;
}
