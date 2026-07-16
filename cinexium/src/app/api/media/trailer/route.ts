import { NextRequest, NextResponse } from 'next/server';
import { tmdb } from '@/lib/tmdb';

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type');
  const id = request.nextUrl.searchParams.get('id');

  if ((type !== 'movie' && type !== 'tv') || !id) {
    return NextResponse.json({ error: 'Invalid trailer request' }, { status: 400 });
  }

  const trailerKey = await tmdb.getTrailerKey(type, id);

  return NextResponse.json(
    { trailerKey },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
}
