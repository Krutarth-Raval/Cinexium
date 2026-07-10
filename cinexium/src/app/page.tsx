import { cookies, headers } from 'next/headers';
import { HeroBanner } from '@/components/home/HeroBanner';
import { MediaCarousel } from '@/components/home/MediaCarousel';
import { tmdb } from '@/lib/tmdb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getUserHistory } from '@/lib/history';
import { prisma } from '@/lib/prisma';

const getCountryCode = (countryName: string) => {
  const map: Record<string, string> = {
    'united states': 'US', 'usa': 'US', 'india': 'IN', 'united kingdom': 'GB', 'uk': 'GB',
    'canada': 'CA', 'australia': 'AU', 'germany': 'DE', 'france': 'FR', 'japan': 'JP',
    'south korea': 'KR', 'brazil': 'BR', 'mexico': 'MX', 'italy': 'IT', 'spain': 'ES',
    'russia': 'RU', 'china': 'CN',
  };
  return map[countryName.toLowerCase()] || 'US';
};

const getCountryName = (code: string) => {
  const map: Record<string, string> = {
    'US': 'United States', 'IN': 'India', 'GB': 'United Kingdom', 'CA': 'Canada',
    'AU': 'Australia', 'DE': 'Germany', 'FR': 'France', 'JP': 'Japan', 'KR': 'South Korea',
    'BR': 'Brazil', 'MX': 'Mexico', 'IT': 'Italy', 'ES': 'Spain', 'RU': 'Russia', 'CN': 'China',
  };
  return map[code.toUpperCase()] || code;
};

export default async function Home() {
  const cookieStore = await cookies();
  const region = cookieStore.get('cinexium_region')?.value || 'hollywood';
  
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  let userCountry = '';
  let countryCode = '';

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { country: true } });
    if (user?.country) {
      userCountry = user.country;
      countryCode = getCountryCode(user.country);
    }
  }

  if (!userCountry) {
    const headersList = await headers();
    const ipCountry = headersList.get('x-vercel-ip-country');
    if (ipCountry) {
      countryCode = ipCountry;
      userCountry = getCountryName(ipCountry);
    } else {
      userCountry = 'United States';
      countryCode = 'US';
    }
  }

  // Fetch all data concurrently for maximum performance
  const [
    featuredItems,
    moviesNowPlaying,
    seriesNowPlaying,
    moviesPopular,
    seriesPopular,
    moviesTopRated,
    seriesTopRated,
    userHistory,
    trendingCountryData
  ] = await Promise.all([
    tmdb.getFeaturedHero(region),
    tmdb.getMovies('now_playing', region),
    tmdb.getSeries('now_playing', region),
    tmdb.getMovies('popular', region),
    tmdb.getSeries('popular', region),
    tmdb.getMovies('top_rated', region),
    tmdb.getSeries('top_rated', region),
    userId ? getUserHistory(userId) : Promise.resolve([]),
    tmdb.getTrendingByCountry(countryCode, region)
  ]);

  return (
    <main className="min-h-screen flex flex-col pb-8">
      <HeroBanner items={featuredItems} />
      
      {/* Media Carousels */}
      <div className="flex flex-col gap-2 mt-4 sm:mt-8">
        {session && userHistory.length > 0 && (
          <MediaCarousel title="Your Recent" items={userHistory} />
        )}
        <MediaCarousel title="Now Playing Movies" items={moviesNowPlaying} />
        <MediaCarousel title="Now Playing Series" items={seriesNowPlaying} />
        <MediaCarousel title="Popular Movies" items={moviesPopular} />
        <MediaCarousel title="Popular Series" items={seriesPopular} />
        <MediaCarousel title="Top Rated Movies" items={moviesTopRated} />
        <MediaCarousel title="Top Rated Series" items={seriesTopRated} />
        {trendingCountryData.length > 0 && (
          <MediaCarousel title={`Trending: ${userCountry} Top 20`} items={trendingCountryData} />
        )}
      </div>
    </main>
  );
}
