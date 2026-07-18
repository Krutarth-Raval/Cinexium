import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { syncExpiredSubscriptionForUser } from '@/lib/subscriptions';
import { VALID_THEME_IDS } from '@/lib/themes';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { themePreference } = body;

    if (!themePreference) {
      return NextResponse.json({ error: 'Theme preference is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await syncExpiredSubscriptionForUser(user.id);

    const refreshedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!refreshedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate theme choice
    if (!VALID_THEME_IDS.includes(themePreference)) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
    }

    // Ensure free users can only use default
    if (!refreshedUser.isPremium && themePreference !== 'default') {
      return NextResponse.json({ error: 'Premium required for custom themes' }, { status: 403 });
    }

    // Update user
    await prisma.user.update({
      where: { id: refreshedUser.id },
      data: { themePreference },
    });

    return NextResponse.json({ success: true, themePreference });
  } catch (error) {
    console.error('Theme API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
