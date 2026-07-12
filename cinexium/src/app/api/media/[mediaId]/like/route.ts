import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const { mediaId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const mediaType = body.mediaType || body.type || 'movie'; // fallback

    const existingLike = await prisma.mediaLike.findUnique({
      where: {
        mediaId_userId: {
          mediaId,
          userId
        }
      }
    });

    if (existingLike) {
      await prisma.mediaLike.delete({
        where: { id: existingLike.id }
      });
      return NextResponse.json({ success: true, isLiked: false });
    } else {
      await prisma.mediaLike.create({
        data: {
          mediaId,
          mediaType,
          userId
        }
      });
      return NextResponse.json({ success: true, isLiked: true });
    }

  } catch (error: any) {
    console.error('Error toggling media like:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
