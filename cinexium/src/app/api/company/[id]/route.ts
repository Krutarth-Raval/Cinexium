import { NextRequest, NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB API key is missing' }, { status: 500 });
  }

  try {
    // Fetch company details
    const companyRes = await fetch(`${TMDB_BASE_URL}/company/${id}?api_key=${TMDB_API_KEY}`);
    
    if (!companyRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch company details' }, { status: companyRes.status });
    }

    const companyData = await companyRes.json();

    // Fetch movies produced by this company
    const moviesRes = await fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_companies=${id}&sort_by=popularity.desc`);
    const moviesData = moviesRes.ok ? await moviesRes.json() : { results: [] };

    // Fetch series produced by this company
    const seriesRes = await fetch(`${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_companies=${id}&sort_by=popularity.desc`);
    const seriesData = seriesRes.ok ? await seriesRes.json() : { results: [] };

    return NextResponse.json({
      ...companyData,
      produced_movies: moviesData.results,
      produced_series: seriesData.results,
    });
  } catch (error) {
    console.error(`Error fetching company ${id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
