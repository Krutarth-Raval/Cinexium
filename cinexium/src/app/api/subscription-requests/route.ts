import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/authOptions';
import { getUserChannelName, pusherServer } from '@/lib/pusher';
import { prisma } from '@/lib/prisma';
import { enforceSameOrigin, isValidPlan, jsonError } from '@/lib/security';
import {
  calculatePaymentLinkExpiry,
  calculateRequestCooldownExpiry,
  hasSubscriptionRequestTable,
  noteMissingSubscriptionRequestTable,
  SUBSCRIPTION_REQUEST_NOTIFICATION,
  syncSubscriptionRequestLifecycle,
} from '@/lib/subscriptions';

function serializeRequestState(request: {
  id: string;
  plan: string;
  status: string;
  requestedAt: Date;
  paymentEmailSentAt: Date | null;
  paymentEmailSent: boolean;
}) {
  const now = Date.now();
  const cooldownUntil = calculateRequestCooldownExpiry(request.requestedAt);
  const actionExpiresAt = request.status === 'WAITING_FOR_PAYMENT'
    ? (request.paymentEmailSentAt ? calculatePaymentLinkExpiry(request.paymentEmailSentAt) : null)
    : cooldownUntil;

  return {
    id: request.id,
    plan: request.plan,
    status: request.status,
    buttonLabel: 'Request Sent',
    disabled: Boolean(actionExpiresAt && actionExpiresAt.getTime() > now),
    requestedAt: request.requestedAt,
    actionExpiresAt,
    paymentEmailSent: request.paymentEmailSent,
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return jsonError('Unauthorized', 401);
    }

    if (!(await hasSubscriptionRequestTable())) {
      noteMissingSubscriptionRequestTable();
      return NextResponse.json({ request: null, storageReady: false });
    }

    await syncSubscriptionRequestLifecycle();

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      return jsonError('User not found', 404);
    }

    const latestRequest = await prisma.subscriptionRequest.findFirst({
      where: {
        userId: user.id,
        status: {
          in: ['PENDING', 'WAITING_FOR_PAYMENT'],
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
      select: {
        id: true,
        plan: true,
        status: true,
        requestedAt: true,
        paymentEmailSentAt: true,
        paymentEmailSent: true,
      },
    });

    return NextResponse.json({
      request: latestRequest ? serializeRequestState(latestRequest) : null,
      storageReady: true,
    });
  } catch (error) {
    console.error('Subscription request status API Error:', error);
    return jsonError('Failed to load subscription request status', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const originError = enforceSameOrigin(request);
    if (originError) return originError;

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return jsonError('Unauthorized', 401);
    }

    const { plan } = await request.json();
    if (!isValidPlan(plan)) {
      return jsonError('Invalid plan selected');
    }

    if (!(await hasSubscriptionRequestTable())) {
      noteMissingSubscriptionRequestTable();
      return jsonError('Subscription requests are not ready yet. Please apply the latest database migration first.', 503);
    }

    await syncSubscriptionRequestLifecycle();

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        isPremium: true,
      },
    });

    if (!user) {
      return jsonError('User not found', 404);
    }

    if (user.isPremium) {
      return jsonError('Your account already has an active Premium subscription.');
    }

    const existingRequest = await prisma.subscriptionRequest.findFirst({
      where: {
        userId: user.id,
        status: {
          in: ['PENDING', 'WAITING_FOR_PAYMENT'],
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
      select: {
        id: true,
        plan: true,
        status: true,
        requestedAt: true,
        paymentEmailSentAt: true,
        paymentEmailSent: true,
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          error: 'A recent subscription request already exists.',
          request: serializeRequestState(existingRequest),
        },
        { status: 409 }
      );
    }

    const createdRequest = await prisma.subscriptionRequest.create({
      data: {
        userId: user.id,
        avatar: user.avatar || '',
        username: user.username,
        email: user.email,
        plan,
        status: 'PENDING',
      },
    });

    const admins = await prisma.user.findMany({
      where: {
        role: 'admin',
      },
      select: {
        id: true,
      },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          actorId: user.id,
          type: SUBSCRIPTION_REQUEST_NOTIFICATION,
          referenceId: createdRequest.id,
          referenceType: plan,
        })),
      });

      await Promise.all(
        admins.map((admin) =>
          pusherServer.trigger(getUserChannelName(admin.id), 'receiveNotification', {
            targetUserId: admin.id,
            type: SUBSCRIPTION_REQUEST_NOTIFICATION,
            actor: {
              id: user.id,
              username: user.username,
            },
          })
        )
      );
    }

    return NextResponse.json({
      success: true,
      requestId: createdRequest.id,
      request: serializeRequestState({
        id: createdRequest.id,
        plan: createdRequest.plan,
        status: createdRequest.status,
        requestedAt: createdRequest.requestedAt,
        paymentEmailSentAt: createdRequest.paymentEmailSentAt,
        paymentEmailSent: createdRequest.paymentEmailSent,
      }),
    });
  } catch (error) {
    console.error('Subscription request API Error:', error);
    return jsonError('Failed to create subscription request', 500);
  }
}
