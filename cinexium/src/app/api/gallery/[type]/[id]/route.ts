import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params;
  
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const tab = searchParams.get('tab') || 'posters'; // 'posters', 'banners', 'videos'

  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'Missing TMDB API Key' }, { status: 500 });
  }

  try {
    let items: any[] = [];
    
    if (tab === 'videos') {
      const response = await fetch(`${TMDB_BASE_URL}/${type}/${id}/videos?api_key=${TMDB_API_KEY}`, { next: { revalidate: 3600 } });
      if (!response.ok) throw new Error('Failed to fetch videos');
      const data = await response.json();
      items = data.results || [];
    } else {
      // Including include_image_language parameter helps get images without text + specific languages
      const response = await fetch(`${TMDB_BASE_URL}/${type}/${id}/images?api_key=${TMDB_API_KEY}&include_image_language=en,null`, { next: { revalidate: 3600 } });
      if (!response.ok) throw new Error('Failed to fetch images');
      const data = await response.json();
      items = tab === 'banners' ? (data.backdrops || []) : (data.posters || []);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedItems = items.slice(startIndex, endIndex);
    const hasMore = endIndex < items.length;

    return NextResponse.json({
      results: paginatedItems,
      page,
      hasMore,
      total: items.length
    });
  } catch (error) {
    console.error('Error in gallery API:', error);
    return NextResponse.json({ error: 'Failed to fetch gallery' }, { status: 500 });
  }
}
