import { prisma } from '@/lib/prisma';
import { tmdb } from '@/lib/tmdb';
import { MediaItem } from '@/components/home/HeroBanner';

export const getUserHistory = async (userId: string): Promise<MediaItem[]> => {
  try {
    const historyEntries = await prisma.history.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      take: 50, // Fetch more to account for duplicates before filtering
    });

    if (!historyEntries.length) return [];

    // Deduplicate by mediaId, keeping the first (most recent) occurrence
    const seen = new Set();
    const uniqueEntries = historyEntries.filter(entry => {
      if (seen.has(entry.mediaId)) return false;
      seen.add(entry.mediaId);
      return true;
    });

    // Fetch details from TMDB in parallel
    const mediaPromises = uniqueEntries.map(entry => 
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
