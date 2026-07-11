import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    const existingLike = await prisma.collectionLike.findUnique({
      where: {
        userId_collectionId: {
          userId: user.id,
          collectionId: id
        }
      }
    });

    if (existingLike) {
      // Unlike
      await prisma.collectionLike.delete({
        where: { id: existingLike.id }
      });
      return NextResponse.json({ success: true, liked: false });
    } else {
      // Like
      await prisma.collectionLike.create({
        data: {
          userId: user.id,
          collectionId: id
        }
      });
      return NextResponse.json({ success: true, liked: true });
    }
  } catch (error: any) {
    console.error('Error toggling like:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
