import { prisma } from '@/lib/prisma';
import { tmdb } from '@/lib/tmdb';
import { MediaItem } from '@/components/home/HeroBanner';

export const getUserHistory = async (userId: string): Promise<MediaItem[]> => {
  try {
    const historyEntries = await prisma.history.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      take: 20,
    });

    if (!historyEntries.length) return [];

    // Fetch details from TMDB in parallel
    const mediaPromises = historyEntries.map(entry => 
      tmdb.getMediaDetails(entry.mediaType as 'movie' | 'tv', entry.mediaId)
    );

    const mediaItems = await Promise.all(mediaPromises);

    // Filter out nulls (if TMDB request fails or item removed)
    return mediaItems.filter((item): item is MediaItem => item !== null);
  } catch (error) {
    console.error('Error fetching user history:', error);
    return [];
  }
};
