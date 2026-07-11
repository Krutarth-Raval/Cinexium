import { NextRequest, NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; seasonNumber: string }> }
) {
  const { id, seasonNumber } = await params;

  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'Missing TMDB API Key' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${id}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&append_to_response=credits`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch season data: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching season data:', error);
    return NextResponse.json({ error: 'Failed to fetch season data' }, { status: 500 });
  }
}
