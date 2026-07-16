import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const PERSON_CACHE_TTL_MS = 1000 * 60 * 60;

type PersonCacheEntry = {
  expiresAt: number;
  data: any;
};

const personCache = new Map<string, PersonCacheEntry>();
const personRequestCache = new Map<string, Promise<any>>();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB API key not configured' }, { status: 500 });
  }

  try {
    const cached = personCache.get(id);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      });
    }

    let personPromise = personRequestCache.get(id);
    if (!personPromise) {
      personPromise = (async () => {
        const url = `${TMDB_BASE_URL}/person/${id}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=combined_credits`;
        const response = await fetch(url, {
          next: { revalidate: 3600 },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch person details: ${response.status}`);
        }

        const data = await response.json();
        personCache.set(id, {
          data,
          expiresAt: Date.now() + PERSON_CACHE_TTL_MS,
        });
        return data;
      })().finally(() => {
        personRequestCache.delete(id);
      });

      personRequestCache.set(id, personPromise);
    }

    const data = await personPromise;
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching person details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch person details' },
      { status: 504 }
    );
  }
}
