import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB API key not configured' }, { status: 500 });
  }

  try {
    const url = `${TMDB_BASE_URL}/person/${id}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=combined_credits`;
    
    const response = await fetch(url, { 
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch person details' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const cast = Array.isArray(data.combined_credits?.cast)
      ? data.combined_credits.cast.map((entry: any) => ({
          id: entry.id,
          media_type: entry.media_type,
          poster_path: entry.poster_path,
          title: entry.title,
          name: entry.name,
          character: entry.character,
          popularity: entry.popularity,
          release_date: entry.release_date,
          first_air_date: entry.first_air_date,
        }))
      : [];

    return NextResponse.json(
      {
        name: data.name,
        profile_path: data.profile_path,
        birthday: data.birthday,
        deathday: data.deathday,
        place_of_birth: data.place_of_birth,
        biography: data.biography,
        combined_credits: {
          cast,
        },
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
