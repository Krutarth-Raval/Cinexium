import { tmdb } from '@/lib/tmdb';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import WatchClient from './WatchClient';

export async function generateMetadata({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  const details = await tmdb.getFullMediaDetails(type as any, id);
  if (!details) return { title: 'Not Found' };
  return { title: `Watch ${details.title || details.name} - Cinexium` };
}

export default async function WatchPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;

  if (type !== 'movie' && type !== 'tv' && type !== 'series') {
    return notFound();
  }

  const normalizedType = type === 'series' ? 'tv' : (type as 'movie' | 'tv');

  const details = await tmdb.getFullMediaDetails(normalizedType, id);
  if (!details) {
    return notFound();
  }

  const cookieStore = await cookies();
  const regionCookie = cookieStore.get('cinexium_region');
  const region = regionCookie?.value || 'hollywood';

  return (
    <WatchClient
      mediaId={id}
      mediaType={normalizedType}
      title={details.title || details.name}
      seasons={details.seasons}
      region={region}
    />
  );
}
