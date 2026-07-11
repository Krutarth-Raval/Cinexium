import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const { mediaId } = await params;
    const session = await getServerSession(authOptions);

    let isLiked = false;
    let isSaved = false;
    const userId = (session?.user as any)?.id;

    const [likesCount, commentsCount, sharesCount, savesCount, existingLike, existingSave] = await Promise.all([
      prisma.mediaLike.count({ where: { mediaId } }).catch(() => 0),
      prisma.mediaComment.count({ where: { mediaId } }).catch(() => 0),
      prisma.mediaShare.count({ where: { mediaId } }).catch(() => 0),
      prisma.collectionItem.count({ where: { mediaId } }).catch(() => 0),
      userId
        ? prisma.mediaLike.findUnique({
            where: {
              mediaId_userId: { mediaId, userId }
            }
          }).catch(() => null)
        : Promise.resolve(null),
      userId
        ? prisma.collectionItem.findFirst({
            where: { mediaId, collection: { userId } }
          }).catch(() => null)
        : Promise.resolve(null)
    ]);

    if (existingLike) {
      isLiked = true;
    }
    if (existingSave) {
      isSaved = true;
    }

    return NextResponse.json({
      likesCount,
      commentsCount,
      sharesCount,
      savesCount,
      isLiked,
      isSaved
    });
  } catch (error: any) {
    console.error('Error fetching media stats:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
