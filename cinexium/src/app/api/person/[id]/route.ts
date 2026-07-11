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
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching person details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
