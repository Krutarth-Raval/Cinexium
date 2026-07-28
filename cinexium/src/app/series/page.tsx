import { InfiniteMediaGrid } from '@/components/media/InfiniteMediaGrid';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TV Series - Cinexium',
  description: 'Browse and discover the latest and greatest TV series on Cinexium.',
  alternates: { canonical: 'https://cinexium.site/series' },
  openGraph: {
    title: 'TV Series - Cinexium',
    description: 'Browse and discover the latest and greatest TV series on Cinexium.',
    url: 'https://cinexium.site/series',
    images: [{ url: 'https://cinexium.site/og-image.png', width: 1200, height: 630, alt: 'TV Series' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TV Series - Cinexium',
    description: 'Browse and discover the latest and greatest TV series on Cinexium.',
    images: ['https://cinexium.site/og-image.png'],
  },
};

export default async function SeriesPage() {
  const cookieStore = await cookies();
  const region = cookieStore.get('cinexium_region')?.value || 'hollywood';

  return <InfiniteMediaGrid key={region} type="tv" title="Series" region={region} />;
}
