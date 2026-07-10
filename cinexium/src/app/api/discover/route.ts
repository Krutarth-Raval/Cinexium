import { NextResponse } from 'next/server';
import { tmdb } from '@/lib/tmdb';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as 'movie' | 'tv';
  const pageStr = searchParams.get('page');
  const page = pageStr ? parseInt(pageStr, 10) : 1;
  const genre = searchParams.get('genre');

  if (type !== 'movie' && type !== 'tv') {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  // Get region from cookies
  const cookieStore = await cookies();
  const regionCookie = cookieStore.get('cinexium_region');
  const region = regionCookie?.value || 'hollywood';

  const movieGenreMap: Record<string, string> = {
    'action': '28',
    'comedy': '35',
    'drama': '18',
    'sci-fi': '878',
    'horror': '27',
    'romance': '10749',
    'thriller': '53',
    'animation': '16',
    'documentary': '99'
  };

  const tvGenreMap: Record<string, string> = {
    'action': '10759', // Action & Adventure
    'comedy': '35',
    'drama': '18',
    'sci-fi': '10765', // Sci-Fi & Fantasy
    'horror': '9648', // Mystery (Closest to horror for TV)
    'romance': '18', // Drama often encompasses romance in TV
    'thriller': '80', // Crime
    'animation': '16',
    'documentary': '99'
  };

  const genreMap = type === 'tv' ? tvGenreMap : movieGenreMap;
  const genreId = genre ? genreMap[genre.toLowerCase()] : undefined;

  try {
    const results = await tmdb.getDiscoverMedia(type, region, page, genreId);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Discover API error:', error);
    return NextResponse.json({ error: 'Discover failed' }, { status: 500 });
  }
}
