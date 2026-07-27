import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const type = searchParams.get('type') || 'movie';

  if (!id) {
    return NextResponse.json({ available: false }, { status: 400 });
  }

  try {
    const url = type === 'movie' 
      ? `https://vidlink.pro/movie/${id}`
      : `https://vidlink.pro/tv/${id}/1/1`;

    const res = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      // Very short timeout so we don't hang the UI
      signal: AbortSignal.timeout(3000)
    });
    
    // Vidlink returns 500 when media is not found
    if (res.status === 200) {
      return NextResponse.json({ available: true });
    } else {
      return NextResponse.json({ available: false });
    }
  } catch (error) {
    // If request fails (e.g. timeout), default to true so we don't accidentally block working videos
    return NextResponse.json({ available: true });
  }
}
