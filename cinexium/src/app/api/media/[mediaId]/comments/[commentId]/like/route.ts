import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

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
      return NextResponse.json({ success: true, action: 'liked' });
    }
  } catch (error) {
    console.error('Error toggling comment like:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
