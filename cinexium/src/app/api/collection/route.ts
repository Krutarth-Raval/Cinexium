import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
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

    const { name, description, isPublic } = await req.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Premium Enforcement
    if (!user.isPremium) {
      const collectionCount = await prisma.collection.count({
        where: { userId: user.id }
      });

      if (collectionCount >= 2) {
        return NextResponse.json({ 
          error: 'Free users can only create up to 2 collections. Upgrade to Pro for unlimited collections!' 
        }, { status: 403 });
      }
    }

    // Check unique constraint per user
    const existing = await prisma.collection.findUnique({
      where: {
        userId_name: {
          userId: user.id,
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
        description: description || '',
        isPublic: isPublic !== undefined ? isPublic : true,
        userId: user.id
      }
    });

    return NextResponse.json({ success: true, collection });
  } catch (error: any) {
    console.error('Error creating collection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
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
  } catch (error: any) {
    console.error('Error fetching collections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
