import { tmdb } from '@/lib/tmdb';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import WatchClient from './WatchClient';

export async function generateMetadata({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  const details = await tmdb.getFullMediaDetails(type as any, id);
  if (!details) return { title: 'Not Found' };
  
  const title = `Watch ${details.title || details.name} - Cinexium`;
  const description = `Watch ${details.title || details.name} in high quality on Cinexium.`;
  const image = details.backdrop_path ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}` : (details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : 'https://cinexium.site/og-image.png');
  const url = `https://cinexium.site/watch/${type}/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: [{ url: image, width: 1280, height: 720, alt: title }],
      type: 'video.other',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    }
  };
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
