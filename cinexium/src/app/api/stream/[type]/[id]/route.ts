import { NextResponse } from 'next/server';
import { MOVIES } from '@consumet/extensions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params;
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const season = searchParams.get('season');
    const episode = searchParams.get('episode');

    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

    const flixhq = new MOVIES.FlixHQ();
    const searchRes = await flixhq.search(title);

    if (!searchRes.results || searchRes.results.length === 0) {
      return NextResponse.json({ error: 'Movie not found on FlixHQ' }, { status: 404 });
    }

    let movie = searchRes.results.find(r => {
      const rTitle = typeof r.title === 'string' ? r.title : (r.title as any).english || (r.title as any).romaji || (r.title as any).native || '';
      return rTitle.toLowerCase() === title.toLowerCase();
    });
    if (!movie) movie = searchRes.results[0];

    const info = await flixhq.fetchMediaInfo(movie.id);
    if (!info.episodes || info.episodes.length === 0) {
      return NextResponse.json({ error: 'No episodes found' }, { status: 404 });
    }

    let episodeId = info.episodes[0].id;
    if (type === 'tv' && season && episode) {
        const ep = info.episodes.find(e => e.season === Number(season) && e.number === Number(episode));
        if (ep) episodeId = ep.id;
    }

    const stream = await flixhq.fetchEpisodeSources(episodeId, movie.id);
    return NextResponse.json(stream);
  } catch (error) {
    console.error('Consumet API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stream', details: String(error), stack: (error as Error)?.stack }, { status: 500 });
  }
}
