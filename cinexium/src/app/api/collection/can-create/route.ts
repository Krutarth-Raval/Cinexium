import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { syncExpiredSubscriptionForUser } from '@/lib/subscriptions';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ canCreate: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ canCreate: false, error: 'User not found' }, { status: 404 });
    }

    await syncExpiredSubscriptionForUser(user.id);
    const refreshedUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!refreshedUser) {
      return NextResponse.json({ canCreate: false, error: 'User not found' }, { status: 404 });
    }

    if (refreshedUser.isPremium) {
      return NextResponse.json({ canCreate: true, isPremium: true });
    }

    const collectionCount = await prisma.collection.count({
      where: { userId: refreshedUser.id }
    });

    if (collectionCount >= 3) {
      return NextResponse.json({ canCreate: false, isPremium: false, reason: 'limit_reached' });
    }

    return NextResponse.json({ canCreate: true, isPremium: false });
  } catch (error: any) {
    console.error('Error checking collection limit:', error);
    return NextResponse.json({ canCreate: true, error: 'Internal server error' }, { status: 500 });
  }
}
