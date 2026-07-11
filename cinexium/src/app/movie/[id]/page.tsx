import { tmdb } from '@/lib/tmdb';
import { notFound } from 'next/navigation';
import { MovieHero } from './MovieHero';
import { MovieBentoGrid } from './MovieBentoGrid';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const details = await tmdb.getFullMediaDetails('movie', id);
  if (!details) return { title: 'Movie Not Found' };
  return {
    title: `${details.title} - Cinexium`,
    description: details.overview,
  };
}

export default async function MovieDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const details = await tmdb.getFullMediaDetails('movie', id);
  
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
        mediaType="movie"
        title={details.title}
        tagline={details.tagline}
        overview={details.overview}
        backdropPath={details.backdrop_path}
        posterPath={details.poster_path}
        trailerKey={trailer?.key}
      />
      
      <MovieBentoGrid details={details} />
    </div>
  );
}
