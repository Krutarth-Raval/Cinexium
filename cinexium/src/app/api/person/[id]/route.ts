import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';

type TmdbCredit = {
  id: number;
  media_type: 'movie' | 'tv';
  poster_path: string | null;
  title?: string | null;
  name?: string | null;
  character?: string | null;
  popularity?: number | null;
  release_date?: string | null;
  first_air_date?: string | null;
};

async function fetchTmdbJson<T>(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`TMDB request failed with ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB API key not configured' }, { status: 500 });
  }

  try {
    const personUrl = `${TMDB_BASE_URL}/person/${id}?api_key=${TMDB_API_KEY}&language=en-US`;
    const creditsUrl = `${TMDB_BASE_URL}/person/${id}/combined_credits?api_key=${TMDB_API_KEY}&language=en-US`;

    const [personResult, creditsResult] = await Promise.allSettled([
      fetchTmdbJson<any>(personUrl, 3000),
      fetchTmdbJson<{ cast?: TmdbCredit[] }>(creditsUrl, 3500),
    ]);

    if (personResult.status !== 'fulfilled') {
      return NextResponse.json({ error: 'Failed to fetch person details' }, { status: 504 });
    }

    const person = personResult.value;
    const credits =
      creditsResult.status === 'fulfilled'
        ? (creditsResult.value.cast ?? []).map((credit) => ({
            id: credit.id,
            media_type: credit.media_type,
            poster_path: credit.poster_path,
            title: credit.title ?? null,
            name: credit.name ?? null,
            character: credit.character ?? null,
            popularity: credit.popularity ?? 0,
            release_date: credit.release_date ?? null,
            first_air_date: credit.first_air_date ?? null,
          }))
        : [];

    return NextResponse.json(
      {
        id: person.id,
        name: person.name,
        profile_path: person.profile_path ?? null,
        birthday: person.birthday ?? null,
        deathday: person.deathday ?? null,
        place_of_birth: person.place_of_birth ?? null,
        biography: person.biography ?? '',
        combined_credits: { cast: credits },
        creditsUnavailable: creditsResult.status !== 'fulfilled',
      },
      {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
      }
    );
  } catch (error) {
    console.error('Error fetching person details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
