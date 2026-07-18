import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { createPushNotification } from '@/lib/push/service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ mediaId: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;
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

    // Toggle Like
    const existingLike = await prisma.mediaCommentLike.findUnique({
      where: {
        commentId_userId: {
          commentId: commentId,
          userId: user.id
        }
      }
    });

    if (existingLike) {
      await prisma.mediaCommentLike.delete({
        where: { id: existingLike.id }
      });
      return NextResponse.json({ success: true, action: 'unliked' });
    } else {
      await prisma.mediaCommentLike.create({
        data: {
          commentId: commentId,
          userId: user.id
        }
      });

      const comment = await prisma.mediaComment.findUnique({
        where: { id: commentId },
        select: {
          id: true,
          userId: true,
          mediaId: true,
          mediaType: true,
        },
      });

      if (comment && comment.userId !== user.id) {
        await createPushNotification({
          userId: comment.userId,
          actor: {
            id: user.id,
            username: user.username,
            name: user.name,
            avatar: user.avatar,
          },
          actorId: user.id,
          type: 'COMMENT_LIKE',
          title: `${user.name} liked your comment`,
          body: 'Open the discussion to see the activity.',
          deepLink: `/${comment.mediaType === 'tv' || comment.mediaType === 'series' ? 'series' : 'movie'}/${comment.mediaId}#comment-${comment.id}`,
          referenceId: comment.mediaId,
          referenceType: comment.mediaType === 'series' ? 'tv' : comment.mediaType,
          eventKey: `comment-like:${commentId}:${user.id}:${comment.userId}`,
          suppressWhenActive: {
            pageType: comment.mediaType === 'tv' || comment.mediaType === 'series' ? 'series' : 'movie',
            pageTargetId: comment.mediaId,
          },
        });
      }

      return NextResponse.json({ success: true, action: 'liked' });
    }
  } catch (error) {
    console.error('Error toggling comment like:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
