import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { createPushNotification } from '@/lib/push/service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, username: true, name: true, avatar: true, role: true },
    });

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const mediaId = typeof body.mediaId === 'string' ? body.mediaId : '';
    const mediaType = body.mediaType === 'tv' ? 'tv' : 'movie';
    const title = typeof body.title === 'string' ? body.title : '';
    const image = typeof body.image === 'string' ? body.image : null;
    const seasonNumber = Number(body.seasonNumber || 0);
    const episodeNumber = Number(body.episodeNumber || 0);
    const releaseType = body.releaseType === 'season'
      ? 'WATCHLIST_SEASON_RELEASE'
      : body.releaseType === 'streaming'
        ? 'WATCHLIST_STREAMING_RELEASE'
        : 'WATCHLIST_EPISODE_RELEASE';

    if (!mediaId || !title) {
      return NextResponse.json({ error: 'Missing mediaId or title' }, { status: 400 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { mediaId, mediaType },
      select: { userId: true },
    });

    const uniqueUserIds = Array.from(new Set(favorites.map((favorite) => favorite.userId)));

    const deepLink = `/${mediaType === 'tv' ? 'series' : 'movie'}/${mediaId}`;
    const pushBody = releaseType === 'WATCHLIST_SEASON_RELEASE'
      ? `A new season of ${title} is out now.`
      : releaseType === 'WATCHLIST_STREAMING_RELEASE'
        ? `${title} is now available for streaming.`
        : `Episode ${episodeNumber || ''}${seasonNumber ? ` of season ${seasonNumber}` : ''} is now available.`.trim();

    await Promise.all(
      uniqueUserIds.map((userId) =>
        createPushNotification({
          userId,
          actor: admin,
          actorId: admin.id,
          type: releaseType,
          title,
          body: pushBody,
          deepLink,
          image,
          referenceId: mediaId,
          referenceType: mediaType,
          eventKey: `watchlist-release:${releaseType}:${mediaId}:${userId}:${seasonNumber}:${episodeNumber}`,
        })
      )
    );

    return NextResponse.json({ success: true, count: uniqueUserIds.length });
  } catch (error) {
    console.error('Watchlist release push error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
