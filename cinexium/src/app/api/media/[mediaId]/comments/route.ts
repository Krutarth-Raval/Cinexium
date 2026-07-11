import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ mediaId: string }> }) {
  try {
    const { mediaId } = await params;
    
    // Fetch top-level comments with their user, likes count, and nested replies
    const comments = await prisma.mediaComment.findMany({
      where: { mediaId, parentId: null },
      orderBy: [
        { likes: { _count: 'desc' } },
        { replies: { _count: 'desc' } },
        { createdAt: 'desc' }
      ],
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true }
        },
        _count: {
          select: { likes: true, replies: true }
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true, username: true, avatar: true } },
            _count: { select: { likes: true } },
            likes: true
          }
        },
        likes: true // Needed to check if current user liked it (handled on client side or we can pass session)
      }
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ mediaId: string }> }) {
  try {
    const { mediaId } = await params;
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

    const { content, mediaType, parentId } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    const comment = await prisma.mediaComment.create({
      data: {
        mediaId,
        mediaType: mediaType || 'movie', // Default to movie
        content: content.trim(),
        userId: user.id,
        parentId: parentId || null,
      },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
        _count: { select: { likes: true, replies: true } },
        likes: true,
        replies: true
      }
    });

    let targetUserId = null;
    let targetUsername = null;
    const mentionMatch = content.match(/@(\w+)/);
    if (mentionMatch) {
      const mentionedUser = await prisma.user.findUnique({ where: { username: mentionMatch[1] } });
      if (mentionedUser) {
        targetUserId = mentionedUser.id;
        targetUsername = mentionedUser.username;
      }
    }

    if (!targetUserId && parentId) {
      const parentComment = await prisma.mediaComment.findUnique({ 
        where: { id: parentId },
        include: { user: true }
      });
      if (parentComment) {
        targetUserId = parentComment.userId;
        targetUsername = parentComment.user.username;
      }
    }

    if (targetUserId && targetUserId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          actorId: user.id,
          type: 'COMMENT_REPLY',
          referenceId: mediaId,
          referenceType: mediaType || 'movie'
        }
      });
      
      // Notify via Pusher directly since we're on the server
      const { pusherServer } = await import('@/lib/pusher');
      await pusherServer.trigger(
        `user-${targetUserId}`,
        'receiveNotification',
        {
          type: 'COMMENT_REPLY',
          actor: { username: user.username },
          referenceId: mediaId,
          referenceType: mediaType || 'movie'
        }
      );
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error posting comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
