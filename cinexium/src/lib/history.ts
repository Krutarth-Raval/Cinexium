import { prisma } from '@/lib/prisma';
import { tmdb } from '@/lib/tmdb';
import { MediaItem } from '@/components/home/HeroBanner';

export const getUserHistory = async (userId: string, limit: number = 10): Promise<{ items: MediaItem[], nextCursor: number | null }> => {
  try {
    const fetchLimit = limit * 3;
    const historyEntries = await prisma.history.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      take: fetchLimit,
    });

    if (!historyEntries.length) return { items: [], nextCursor: null };

    const seen = new Set();
    const uniqueEntries = historyEntries.filter(entry => {
      if (seen.has(entry.mediaId)) return false;
      seen.add(entry.mediaId);
      return true;
    }).slice(0, limit);

    const lastTakenEntry = uniqueEntries[uniqueEntries.length - 1];
    let nextCursor: number | null = null;
    
    if (lastTakenEntry) {
      const lastIndex = historyEntries.findIndex(e => e.id === lastTakenEntry.id);
      if (historyEntries.length === fetchLimit || uniqueEntries.length === limit) {
        nextCursor = lastIndex + 1;
      }
    }

    const mediaPromises = uniqueEntries.map(entry => 
      tmdb.getMediaDetails(entry.mediaType as 'movie' | 'tv', entry.mediaId)
    );

    const mediaItemsRaw = await Promise.all(mediaPromises);
    const mediaItems = mediaItemsRaw.filter((item): item is MediaItem => item !== null);

    return { items: mediaItems, nextCursor };
  } catch (error) {
    console.error('Error fetching user history:', error);
    return { items: [], nextCursor: null };
  }
};
