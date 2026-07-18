import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { applyRateLimit, enforceSameOrigin, getClientIp, MAX_COLLECTION_DESCRIPTION_LENGTH, MAX_COLLECTION_NAME_LENGTH, normalizeText } from '@/lib/security';
import { FREE_COLLECTION_LIMIT, syncExpiredSubscriptionForUser } from '@/lib/subscriptions';

export async function POST(req: NextRequest) {
  try {
    const originError = enforceSameOrigin(req);
    if (originError) return originError;

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await syncExpiredSubscriptionForUser(user.id);
    const refreshedUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!refreshedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const rateLimit = applyRateLimit({
      key: `collection-create:${refreshedUser.id}:${getClientIp(req)}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many collection creation attempts. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();
    const name = normalizeText(body.name, MAX_COLLECTION_NAME_LENGTH);
    const description = normalizeText(body.description, MAX_COLLECTION_DESCRIPTION_LENGTH);
    const isPublic = typeof body.isPublic === 'boolean' ? body.isPublic : true;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Premium Enforcement
    if (!refreshedUser.isPremium) {
      const collectionCount = await prisma.collection.count({
        where: { userId: refreshedUser.id }
      });

      if (collectionCount >= FREE_COLLECTION_LIMIT) {
        return NextResponse.json({ 
          error: `Free users can only create up to ${FREE_COLLECTION_LIMIT} collections. Upgrade to Pro for unlimited collections!`
        }, { status: 403 });
      }
    }

    // Check unique constraint per user
    const existing = await prisma.collection.findUnique({
      where: {
          userId_name: {
          userId: refreshedUser.id,
          name: name
        }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'You already have a collection with this name' }, { status: 400 });
    }

    const collection = await prisma.collection.create({
      data: {
        name,
        description,
        isPublic,
        userId: refreshedUser.id
      }
    });

    return NextResponse.json({ success: true, collection });
  } catch (error) {
    console.error('Error creating collection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const collections = await prisma.collection.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { items: true }
        }
      }
    });

    return NextResponse.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
