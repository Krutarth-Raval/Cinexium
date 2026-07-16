import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/authOptions';
import { sendSubscriptionActivatedEmail } from '@/lib/email';
import { getUserChannelName, pusherServer } from '@/lib/pusher';
import { prisma } from '@/lib/prisma';
import { calculateSubscriptionExpiry, syncSubscriptionRequestLifecycle } from '@/lib/subscriptions';
import { enforceSameOrigin, jsonError } from '@/lib/security';

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

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const originError = enforceSameOrigin(request);
    if (originError) return originError;

    const admin = await getAdminUser();
    if (!admin) {
      return jsonError('Unauthorized', 401);
    }

    if (admin.role !== 'admin') {
      return jsonError('Forbidden', 403);
    }

    await syncSubscriptionRequestLifecycle();

    const { id } = await context.params;
    const subscriptionRequest = await prisma.subscriptionRequest.findUnique({
      where: {
        id,
      },
    });

    if (!subscriptionRequest) {
      return jsonError('Subscription request not found', 404);
    }

    if (subscriptionRequest.status === 'ACTIVE') {
      return jsonError('This subscription is already active.');
    }

    if (subscriptionRequest.status === 'EXPIRED') {
      return jsonError('This subscription request has already expired.');
    }

    if (subscriptionRequest.status !== 'WAITING_FOR_PAYMENT') {
      return jsonError('Payment email must be sent before activating this subscription.');
    }

    const activatedAt = new Date();
    const expiresAt = calculateSubscriptionExpiry(subscriptionRequest.plan as 'monthly' | 'yearly', activatedAt);

    const [, updatedRequest] = await prisma.$transaction([
      prisma.user.update({
        where: {
          id: subscriptionRequest.userId,
        },
        data: {
          isPremium: true,
          premiumType: subscriptionRequest.plan,
          premiumUntil: expiresAt,
        },
      }),
      prisma.subscriptionRequest.update({
        where: {
          id: subscriptionRequest.id,
        },
        data: {
          status: 'ACTIVE',
          activatedAt,
          expiresAt,
        },
      }),
    ]);

    const emailSent = await sendSubscriptionActivatedEmail(subscriptionRequest.email);
    if (!emailSent) {
      console.warn(`Premium activation email was not sent for subscription request ${subscriptionRequest.id}.`);
    }

    await pusherServer.trigger(getUserChannelName(subscriptionRequest.userId), 'premiumActivated', {
      userId: subscriptionRequest.userId,
      premiumType: subscriptionRequest.plan,
      premiumUntil: expiresAt.toISOString(),
    });

    return NextResponse.json({
      success: true,
      request: updatedRequest,
    });
  } catch (error) {
    console.error('Activate subscription API Error:', error);
    return jsonError('Failed to activate subscription', 500);
  }
}
