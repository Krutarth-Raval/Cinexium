import { tmdb } from '@/lib/tmdb';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { MovieHero } from '@/app/movie/[id]/MovieHero';
import { TvBentoGrid } from './TvBentoGrid';
import { cookies } from 'next/headers';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const details = await tmdb.getFullMediaDetails('tv', id);
  if (!details) return { title: 'TV Show Not Found' };
  return {
    title: `${details.name} - Cinexium`,
    description: details.overview,
  };
}

export default async function TvDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const region = cookieStore.get('cinexium_region')?.value || 'hollywood';
  const details = await tmdb.getFullMediaDetails('tv', id);
  
  if (!details) {
    return notFound();
  }

  // Find the official YouTube trailer
  const videos = details.videos?.results || [];
  const trailer = videos.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube') || videos.find((v: any) => v.site === 'YouTube');

  return (
    <div className="min-h-screen bg-[#0f1115] pb-24">
      <MovieHero 
        mediaId={id}
        mediaType="tv"
        title={details.name}
        tagline={details.tagline}
        overview={details.overview}
        backdropPath={details.backdrop_path}
        posterPath={details.poster_path}
        trailerKey={trailer?.key}
      />
      
      <TvBentoGrid details={details} region={region} />
    </div>
  );
}
