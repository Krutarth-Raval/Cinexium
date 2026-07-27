import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mediaId: string; seasonNumber: string }> }
) {
  try {
    const { mediaId, seasonNumber } = await params;
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';

    if (!TMDB_API_KEY) {
      return NextResponse.json({ error: 'TMDB API key not configured' }, { status: 500 });
    }

    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${mediaId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=en-US`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch season details' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching season details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
