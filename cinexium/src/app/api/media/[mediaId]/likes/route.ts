import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ mediaId: string }> }) {
  try {
    const { mediaId } = await params;
    
    const likes = await prisma.mediaLike.findMany({
      where: { mediaId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true }
        }
      }
    });

    return NextResponse.json(likes);
  } catch (error) {
    console.error('Error fetching likes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
