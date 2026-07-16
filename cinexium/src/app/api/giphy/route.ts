import { NextRequest, NextResponse } from 'next/server';
import { enforceSameOrigin } from '@/lib/security';
import { GIPHY_PAGE_SIZE, type GiphyResponse } from '@/lib/giphy';

const GIPHY_API_BASE = 'https://api.giphy.com/v1/gifs';

const clampOffset = (value: string | null) => {
  const parsed = Number(value ?? '0');
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
};

export async function GET(req: NextRequest) {
  const originError = enforceSameOrigin(req);
  if (originError) return originError;

  const apiKey = process.env.GIPHY_API_KEY || process.env.NEXT_PUBLIC_GIPHY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing GIPHY API key' }, { status: 500 });
  }

  const search = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  const offset = clampOffset(req.nextUrl.searchParams.get('offset'));
  const limit = GIPHY_PAGE_SIZE;

  const endpoint = search
    ? `${GIPHY_API_BASE}/search?api_key=${encodeURIComponent(apiKey)}&limit=${limit}&offset=${offset}&rating=pg-13&lang=en&q=${encodeURIComponent(search)}`
    : `${GIPHY_API_BASE}/trending?api_key=${encodeURIComponent(apiKey)}&limit=${limit}&offset=${offset}&rating=pg-13`;

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch GIFs from GIPHY' }, { status: response.status });
    }

    const payload = (await response.json()) as GiphyResponse;
    return NextResponse.json(payload);
  } catch (error) {
    console.error('GIPHY proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch GIFs' }, { status: 500 });
  }
}
