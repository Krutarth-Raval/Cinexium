import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { jsonError } from '@/lib/security';
import { getSubscriptionStatusLabel, hasSubscriptionRequestTable, noteMissingSubscriptionRequestTable, SUBSCRIPTION_REQUEST_NOTIFICATION, syncSubscriptionRequestLifecycle } from '@/lib/subscriptions';

async function getAdminUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    select: {
      id: true,
      role: true,
    },
  });
}

export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return jsonError('Unauthorized', 401);
    }

    if (admin.role !== 'admin') {
      return jsonError('Forbidden', 403);
    }

    if (!(await hasSubscriptionRequestTable())) {
      noteMissingSubscriptionRequestTable();
      return NextResponse.json({
        requests: [],
        notifications: [],
        storageReady: false,
        error: 'Subscription requests storage is not ready yet. Apply the Prisma migration first.',
      });
    }

    await syncSubscriptionRequestLifecycle();

    const [requests, notifications] = await Promise.all([
      prisma.subscriptionRequest.findMany({
        orderBy: {
          requestedAt: 'desc',
        },
      }),
      prisma.notification.findMany({
        where: {
          userId: admin.id,
          type: SUBSCRIPTION_REQUEST_NOTIFICATION,
          isRead: false,
        },
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    return NextResponse.json({
      requests: requests.map((request) => ({
        ...request,
        statusLabel: getSubscriptionStatusLabel(request.status),
      })),
      notifications: notifications.map((notification) => ({
        id: notification.id,
        requestId: notification.referenceId,
        plan: notification.referenceType,
        actor: notification.actor,
        createdAt: notification.createdAt,
      })),
      storageReady: true,
    });
  } catch (error) {
    console.error('Admin subscription requests API Error:', error);
    return jsonError('Failed to load subscription requests', 500);
  }
}
