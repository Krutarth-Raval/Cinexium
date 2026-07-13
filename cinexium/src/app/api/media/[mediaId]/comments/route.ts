import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { applyRateLimit, enforceSameOrigin, getClientIp, MAX_COMMENT_LENGTH, normalizeText } from '@/lib/security';

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
    const originError = enforceSameOrigin(req);
    if (originError) return originError;

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

    const rateLimit = applyRateLimit({
      key: `media-comment:${user.id}:${getClientIp(req)}`,
      limit: 10,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'You are commenting too quickly.' }, { status: 429 });
    }

    const { content, mediaType, parentId } = await req.json();
    const normalizedContent = normalizeText(content, MAX_COMMENT_LENGTH);
    const normalizedMediaType = normalizeText(mediaType, 16) || 'movie';
    const normalizedParentId = normalizeText(parentId, 64) || null;

    if (!normalizedContent) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    if (!['movie', 'tv', 'series'].includes(normalizedMediaType)) {
      return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
    }

    if (normalizedParentId) {
      const parentComment = await prisma.mediaComment.findUnique({
        where: { id: normalizedParentId },
        select: { id: true, mediaId: true },
      });
      if (!parentComment || parentComment.mediaId !== mediaId) {
        return NextResponse.json({ error: 'Invalid parent comment' }, { status: 400 });
      }
    }

    const comment = await prisma.mediaComment.create({
      data: {
        mediaId,
        mediaType: normalizedMediaType === 'series' ? 'tv' : normalizedMediaType,
        content: normalizedContent,
        userId: user.id,
        parentId: normalizedParentId,
      },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
        _count: { select: { likes: true, replies: true } },
        likes: true,
        replies: true
      }
    });

    let targetUserId = null;
    const mentionMatch = normalizedContent.match(/@([a-z0-9_.]{3,24})/i);
    if (mentionMatch) {
      const mentionedUser = await prisma.user.findUnique({ where: { username: mentionMatch[1] } });
      if (mentionedUser) {
        targetUserId = mentionedUser.id;
      }
    }

    if (!targetUserId && normalizedParentId) {
      const parentComment = await prisma.mediaComment.findUnique({ 
        where: { id: normalizedParentId },
        include: { user: true }
      });
      if (parentComment) {
        targetUserId = parentComment.userId;
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
          referenceType: normalizedMediaType === 'series' ? 'tv' : normalizedMediaType
        }
      );
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error posting comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
