import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { syncExpiredSubscriptionForUser } from '@/lib/subscriptions';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await syncExpiredSubscriptionForUser(user.id);
    const refreshedUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!refreshedUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const collection = await prisma.collection.findUnique({ where: { id } });
    if (!collection) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    if (collection.userId !== refreshedUser.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { mediaId, mediaType } = await req.json();
    if (!mediaId || !mediaType) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    // Check if item already exists
    const existing = await prisma.collectionItem.findFirst({
      where: { collectionId: id, mediaId }
    });

    if (!existing) {
      // Check limits before adding
      if (!refreshedUser.isPremium) {
        const count = await prisma.collectionItem.count({ where: { collectionId: id } });
        if (count >= 20) {
          return NextResponse.json({ error: 'Free tier limit reached: Maximum 20 items per collection.', premiumRequired: true }, { status: 403 });
        }
      }
    }

    if (existing) {
      // Remove it
      await prisma.collectionItem.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, action: 'removed' });
    } else {
      // Add it
      await prisma.collectionItem.create({
        data: { collectionId: id, mediaId, mediaType }
      });
      return NextResponse.json({ success: true, action: 'added' });
    }
  } catch (error: any) {
    console.error('Error toggling collection item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const items = await prisma.collectionItem.findMany({
      where: { collectionId: id }
    });
    return NextResponse.json(items.map(item => item.mediaId));
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
