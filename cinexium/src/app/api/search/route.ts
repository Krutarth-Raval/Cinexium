import { NextResponse } from 'next/server';
import { tmdb } from '@/lib/tmdb';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const type = searchParams.get('type') || 'movie'; // 'movie', 'series', 'user', 'multi'

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  try {
    let results: any[] = [];

    if (type === 'movie' || type === 'series' || type === 'tv' || type === 'multi') {
      const tmdbType = type === 'series' ? 'tv' : type as 'movie' | 'tv' | 'multi';
      
      const genreMap: Record<string, string> = {
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
      
      const genreId = genreMap[q.toLowerCase()];
      
      if (genreId && tmdbType !== 'multi') {
        const tmdbResults = await tmdb.discoverByGenre(genreId, tmdbType);
        results = [...results, ...tmdbResults];
      } else {
        const tmdbResults = await tmdb.searchMedia(q, tmdbType);
        results = [...results, ...tmdbResults];
      }
    }

    if (type === 'user' || type === 'multi') {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          bio: true,
        },
        take: 10
      });
      const formattedUsers = users.map(u => ({ ...u, type: 'user' }));
      
    // If multi, prepend users so they show first
      if (type === 'multi') {
        results = [...formattedUsers, ...results];
      } else {
        results = formattedUsers;
      }
    }

    let didYouMean = null;
    try {
      const suggestRes = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`, { next: { revalidate: 3600 } });
      const suggestData = await suggestRes.json();
      if (suggestData[1] && suggestData[1].length > 0) {
        const topSuggestion = suggestData[1][0];
        if (topSuggestion.toLowerCase() !== q.toLowerCase()) {
          didYouMean = topSuggestion;
        }
      }
    } catch (e) {
      console.warn("Could not fetch spelling suggestion", e);
    }

    return NextResponse.json({ results, didYouMean });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
