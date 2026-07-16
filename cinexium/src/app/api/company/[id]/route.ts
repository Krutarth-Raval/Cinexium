import { NextRequest, NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const COMPANY_CACHE_TTL_MS = 1000 * 60 * 60;

type CompanyCacheEntry = {
  expiresAt: number;
  data: any;
};

const companyCache = new Map<string, CompanyCacheEntry>();
const companyRequestCache = new Map<string, Promise<any>>();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB API key is missing' }, { status: 500 });
  }

  try {
    const cached = companyCache.get(id);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      });
    }

    let companyPromise = companyRequestCache.get(id);
    if (!companyPromise) {
      companyPromise = (async () => {
        const [companyRes, moviesRes, seriesRes] = await Promise.all([
          fetch(`${TMDB_BASE_URL}/company/${id}?api_key=${TMDB_API_KEY}`, { next: { revalidate: 3600 } }),
          fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_companies=${id}&sort_by=popularity.desc`, { next: { revalidate: 3600 } }),
          fetch(`${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_companies=${id}&sort_by=popularity.desc`, { next: { revalidate: 3600 } }),
        ]);

        if (!companyRes.ok) {
          throw new Error(`Failed to fetch company details: ${companyRes.status}`);
        }

        const companyData = await companyRes.json();
        const moviesData = moviesRes.ok ? await moviesRes.json() : { results: [] };
        const seriesData = seriesRes.ok ? await seriesRes.json() : { results: [] };

        const payload = {
          ...companyData,
          produced_movies: moviesData.results,
          produced_series: seriesData.results,
        };

        companyCache.set(id, {
          data: payload,
          expiresAt: Date.now() + COMPANY_CACHE_TTL_MS,
        });

        return payload;
      })().finally(() => {
        companyRequestCache.delete(id);
      });

      companyRequestCache.set(id, companyPromise);
    }

    const payload = await companyPromise;

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error(`Error fetching company ${id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
