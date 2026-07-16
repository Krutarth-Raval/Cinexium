import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { enforceSameOrigin, jsonError } from '@/lib/security';
import { hasSubscriptionRequestTable, noteMissingSubscriptionRequestTable, SUBSCRIPTION_REQUEST_NOTIFICATION } from '@/lib/subscriptions';

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

export async function PATCH(request: NextRequest) {
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

    if (!(await hasSubscriptionRequestTable())) {
      noteMissingSubscriptionRequestTable();
      return NextResponse.json({ success: true, storageReady: false });
    }

    const body = await request.json().catch(() => ({}));
    const notificationId = typeof body.notificationId === 'string' ? body.notificationId : null;

    await prisma.notification.updateMany({
      where: {
        userId: admin.id,
        type: SUBSCRIPTION_REQUEST_NOTIFICATION,
        isRead: false,
        ...(notificationId ? { id: notificationId } : {}),
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin subscription notifications API Error:', error);
    return jsonError('Failed to update notification state', 500);
  }
}
