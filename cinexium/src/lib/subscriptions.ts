import { prisma } from '@/lib/prisma';

export const SUBSCRIPTION_REQUEST_NOTIFICATION = 'SUBSCRIPTION_REQUEST';
export const SUBSCRIPTION_REQUEST_COOLDOWN_MS = 3 * 60 * 60 * 1000;
export const SUBSCRIPTION_PAYMENT_LINK_TTL_MS = 10 * 60 * 1000;
export const PREMIUM_EXPIRY_WARNING_WINDOW_MS = 24 * 60 * 60 * 1000;
export const FREE_COLLECTION_LIMIT = 2;
export const FREE_COLLECTION_ITEM_LIMIT = 20;

export const subscriptionRequestStatusLabel = {
  PENDING: 'Pending Request',
  WAITING_FOR_PAYMENT: 'Waiting For Payment',
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
} as const;

export type SubscriptionRequestStatus = keyof typeof subscriptionRequestStatusLabel;

const globalForSubscriptions = globalThis as typeof globalThis & {
  __cinexiumSubscriptionRequestTableState__?: {
    exists: boolean;
    checkedAt: number;
    warnedMissing: boolean;
  };
};

const SUBSCRIPTION_REQUEST_TABLE_CACHE_MS = 60_000;

function isMissingSubscriptionRequestStorage(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as {
    code?: string;
    message?: string;
  };

  return (
    candidate.code === 'P2021' ||
    candidate.code === 'P2022' ||
    candidate.message?.includes('subscriptionRequest') === true ||
    candidate.message?.includes('SubscriptionRequest') === true
  );
}

export async function hasSubscriptionRequestTable() {
  const cached = globalForSubscriptions.__cinexiumSubscriptionRequestTableState__;
  const now = Date.now();

  if (cached && now - cached.checkedAt < SUBSCRIPTION_REQUEST_TABLE_CACHE_MS) {
    return cached.exists;
  }

  const result = await prisma.$queryRaw<Array<{ tableName: string | null }>>`
    SELECT to_regclass('public."SubscriptionRequest"')::text AS "tableName"
  `;

  const exists = Boolean(result[0]?.tableName);
  const warnedMissing = cached?.warnedMissing ?? false;

  globalForSubscriptions.__cinexiumSubscriptionRequestTableState__ = {
    exists,
    checkedAt: now,
    warnedMissing,
  };

  return exists;
}

export function noteMissingSubscriptionRequestTable() {
  const cached = globalForSubscriptions.__cinexiumSubscriptionRequestTableState__;

  if (cached?.warnedMissing) {
    return;
  }

  globalForSubscriptions.__cinexiumSubscriptionRequestTableState__ = {
    exists: false,
    checkedAt: Date.now(),
    warnedMissing: true,
  };

  console.warn('Subscription request storage is unavailable. Skipping expiry sync until the Prisma migration is applied.');
}

export function getSubscriptionStatusLabel(status: string) {
  return subscriptionRequestStatusLabel[status as SubscriptionRequestStatus] ?? status;
}

export function calculateSubscriptionExpiry(plan: 'monthly' | 'yearly', activatedAt = new Date()) {
  const expiresAt = new Date(activatedAt);

  if (plan === 'yearly') {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }

  return expiresAt;
}

export function calculateRequestCooldownExpiry(requestedAt: Date | string) {
  return new Date(new Date(requestedAt).getTime() + SUBSCRIPTION_REQUEST_COOLDOWN_MS);
}

export function calculatePaymentLinkExpiry(sentAt = new Date()) {
  return new Date(sentAt.getTime() + SUBSCRIPTION_PAYMENT_LINK_TTL_MS);
}

export function getPremiumExpiryWarning(premiumUntil: Date | string | null | undefined, isPremium: boolean) {
  if (!isPremium || !premiumUntil) {
    return {
      isExpiringSoon: false,
      expiresInMs: null,
      premiumEndsAt: null,
    };
  }

  const premiumEndsAt = new Date(premiumUntil);
  const expiresInMs = premiumEndsAt.getTime() - Date.now();

  if (Number.isNaN(premiumEndsAt.getTime()) || expiresInMs <= 0) {
    return {
      isExpiringSoon: false,
      expiresInMs: expiresInMs > 0 ? expiresInMs : 0,
      premiumEndsAt: null,
    };
  }

  return {
    isExpiringSoon: expiresInMs <= PREMIUM_EXPIRY_WARNING_WINDOW_MS,
    expiresInMs,
    premiumEndsAt,
  };
}

export async function syncSubscriptionRequestLifecycle() {
  if (!(await hasSubscriptionRequestTable())) {
    noteMissingSubscriptionRequestTable();
    return;
  }

  try {
    const now = new Date();
    const pendingCutoff = new Date(now.getTime() - SUBSCRIPTION_REQUEST_COOLDOWN_MS);
    const waitingCutoff = new Date(now.getTime() - SUBSCRIPTION_PAYMENT_LINK_TTL_MS);

    const [stalePendingRequests, expiredWaitingRequests, expiredActiveRequests] = await Promise.all([
      prisma.subscriptionRequest.findMany({
        where: {
          status: 'PENDING',
          paymentEmailSent: false,
          requestedAt: {
            lte: pendingCutoff,
          },
        },
        select: {
          id: true,
        },
      }),
      prisma.subscriptionRequest.findMany({
        where: {
          status: 'WAITING_FOR_PAYMENT',
          paymentEmailSentAt: {
            lte: waitingCutoff,
          },
        },
        select: {
          id: true,
        },
      }),
      prisma.subscriptionRequest.findMany({
        where: {
          status: 'ACTIVE',
          expiresAt: {
            lte: now,
          },
        },
        select: {
          id: true,
          userId: true,
        },
      }),
    ]);

    const stalePendingIds = stalePendingRequests.map((request) => request.id);
    const expiredWaitingIds = expiredWaitingRequests.map((request) => request.id);
    const expiredActiveIds = expiredActiveRequests.map((request) => request.id);
    const expiredActiveUserIds = [...new Set(expiredActiveRequests.map((request) => request.userId))];

    if (
      stalePendingIds.length === 0 &&
      expiredWaitingIds.length === 0 &&
      expiredActiveIds.length === 0
    ) {
      return;
    }

    const operations = [];

    if (stalePendingIds.length > 0) {
      operations.push(
        prisma.notification.deleteMany({
          where: {
            type: SUBSCRIPTION_REQUEST_NOTIFICATION,
            referenceId: {
              in: stalePendingIds,
            },
          },
        }),
        prisma.subscriptionRequest.deleteMany({
          where: {
            id: {
              in: stalePendingIds,
            },
          },
        })
      );
    }

    if (expiredWaitingIds.length > 0) {
      operations.push(
        prisma.subscriptionRequest.updateMany({
          where: {
            id: {
              in: expiredWaitingIds,
            },
          },
          data: {
            status: 'EXPIRED',
          },
        })
      );
    }

    if (expiredActiveIds.length > 0) {
      operations.push(
        prisma.subscriptionRequest.updateMany({
          where: {
            id: {
              in: expiredActiveIds,
            },
          },
          data: {
            status: 'EXPIRED',
          },
        }),
        prisma.user.updateMany({
          where: {
            id: {
              in: expiredActiveUserIds,
            },
            isPremium: true,
          },
          data: {
            isPremium: false,
            premiumType: null,
            premiumUntil: null,
          },
        })
      );
    }

    await prisma.$transaction(operations);
  } catch (error) {
    if (isMissingSubscriptionRequestStorage(error)) {
      noteMissingSubscriptionRequestTable();
      return;
    }

    throw error;
  }
}

export async function syncExpiredSubscriptions() {
  await syncSubscriptionRequestLifecycle();
}

export async function syncExpiredSubscriptionForUser(userId: string) {
  await syncSubscriptionRequestLifecycle();

  if (!(await hasSubscriptionRequestTable())) {
    noteMissingSubscriptionRequestTable();
    return false;
  }

  const activeRequest = await prisma.subscriptionRequest.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
    },
    select: {
      id: true,
    },
  });

  return !activeRequest;
}
