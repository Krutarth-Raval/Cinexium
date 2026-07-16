import { type GiphyGif } from '@/lib/giphy';

const GIPHY_API_BASE = 'https://api.giphy.com/v1/gifs';

export async function fetchGifDimensionsByIds(ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return {} as Record<string, { width: number; height: number }>;
  }

  const apiKey = process.env.GIPHY_API_KEY || process.env.NEXT_PUBLIC_GIPHY_API_KEY;
  if (!apiKey) {
    return {} as Record<string, { width: number; height: number }>;
  }

  try {
    const endpoint = `${GIPHY_API_BASE}?api_key=${encodeURIComponent(apiKey)}&ids=${encodeURIComponent(uniqueIds.join(','))}`;
    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      return {} as Record<string, { width: number; height: number }>;
    }

    const payload = (await response.json()) as { data?: GiphyGif[] };
    const result: Record<string, { width: number; height: number }> = {};

    for (const gif of payload.data ?? []) {
      const width = Number(gif.images.original?.width || gif.images.fixed_width.width);
      const height = Number(gif.images.original?.height || gif.images.fixed_width.height);

      if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
        result[gif.id] = { width, height };
      }
    }

    return result;
  } catch {
    return {} as Record<string, { width: number; height: number }>;
  }
}
