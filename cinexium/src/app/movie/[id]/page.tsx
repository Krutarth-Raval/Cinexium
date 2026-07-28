import { tmdb } from '@/lib/tmdb';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { MovieHero } from './MovieHero';
import { MovieBentoGrid } from './MovieBentoGrid';
import { cookies } from 'next/headers';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const details = await tmdb.getFullMediaDetails('movie', id);
  if (!details) return { title: 'Movie Not Found' };
  
  const title = `${details.title} - Cinexium`;
  const description = details.overview || 'Explore details, ratings, and trailers for this movie on Cinexium.';
  const image = details.backdrop_path ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}` : (details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '/og-image.png');
  const url = `https://cinexium.site/movie/${id}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: image,
          width: 1280,
          height: 720,
          alt: title,
        }
      ],
      type: 'video.movie',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    }
  };
}

export default async function MovieDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const region = cookieStore.get('cinexium_region')?.value || 'hollywood';
  const details = await tmdb.getFullMediaDetails('movie', id);
  
  if (!details) {
    return notFound();
  }

  // Find the official YouTube trailer
  const videos = details.videos?.results || [];
  const trailer = videos.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube') || videos.find((v: any) => v.site === 'YouTube');

  const session = await getServerSession(authOptions);
  let isPremium = false;
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email },
      select: { isPremium: true, premiumUntil: true }
    });
    if (user?.isPremium) {
      const premiumEndsAt = user.premiumUntil ? new Date(user.premiumUntil) : null;
      if (!premiumEndsAt || premiumEndsAt.getTime() > Date.now()) {
        isPremium = true;
      }
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Movie",
    "name": details.title,
    "description": details.overview,
    "image": details.backdrop_path ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}` : (details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : 'https://cinexium.site/og-image.png'),
    "url": `https://cinexium.site/movie/${id}`,
    "dateCreated": details.release_date,
    ...(trailer?.key && {
      "trailer": {
        "@type": "VideoObject",
        "name": `${details.title} Trailer`,
        "description": `Official trailer for ${details.title}`,
        "thumbnailUrl": `https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg`,
        "uploadDate": details.release_date || new Date().toISOString(),
        "embedUrl": `https://www.youtube.com/embed/${trailer.key}`
      }
    })
  };

  return (
    <div className="min-h-screen bg-[#0f1115] pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MovieHero 
        mediaId={id}
        mediaType="movie"
        title={details.title}
        tagline={details.tagline}
        overview={details.overview}
        backdropPath={details.backdrop_path}
        posterPath={details.poster_path}
        trailerKey={trailer?.key}
        isPremium={isPremium}
        isLoggedIn={!!session?.user}
        releaseDate={details.release_date}
      />
      
      <MovieBentoGrid details={details} region={region} />
    </div>
  );
}
