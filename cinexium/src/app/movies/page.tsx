import { InfiniteMediaGrid } from '@/components/media/InfiniteMediaGrid';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Movies - Cinexium',
  description: 'Browse and discover the latest and greatest movies on Cinexium.',
  alternates: { canonical: 'https://cinexium.site/movies' },
  openGraph: {
    title: 'Movies - Cinexium',
    description: 'Browse and discover the latest and greatest movies on Cinexium.',
    url: 'https://cinexium.site/movies',
    images: [{ url: 'https://cinexium.site/og-image.png', width: 1200, height: 630, alt: 'Movies' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Movies - Cinexium',
    description: 'Browse and discover the latest and greatest movies on Cinexium.',
    images: ['https://cinexium.site/og-image.png'],
  },
};

export default async function MoviesPage() {
  const cookieStore = await cookies();
  const region = cookieStore.get('cinexium_region')?.value || 'hollywood';

  return <InfiniteMediaGrid key={region} type="movie" title="Movies" region={region} />;
}
