import { cookies, headers } from 'next/headers';
import { HeroBanner } from '@/components/home/HeroBanner';
import { MediaCarousel } from '@/components/home/MediaCarousel';
import { tmdb } from '@/lib/tmdb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getUserHistory } from '@/lib/history';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

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

  let isPremium = false;

  if (userId) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { country: true, isPremium: true } });
      if (user?.country) {
        userCountry = user.country;
        countryCode = getCountryCode(user.country);
      }
      if (user?.isPremium) {
        isPremium = true;
      }
    } catch (error) {
      console.error("Database connection error in page.tsx:", error);
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
    trendingCountryData,
    globalTop20
  ] = await Promise.all([
    tmdb.getFeaturedHero(region),
    tmdb.getMovies('now_playing', region),
    tmdb.getSeries('now_playing', region),
    tmdb.getMovies('popular', region),
    tmdb.getSeries('popular', region),
    tmdb.getMovies('top_rated', region),
    tmdb.getSeries('top_rated', region),
    userId ? getUserHistory(userId) : Promise.resolve([]),
    tmdb.getTrendingByCountry(countryCode, region),
    tmdb.getGlobalTop20()
  ]);

  return (
    <main className="min-h-screen flex flex-col pb-8">
      <HeroBanner items={featuredItems} />
      
      {/* Media Carousels */}
      <div className="flex flex-col gap-2 mt-4 sm:mt-8">
        <MediaCarousel title="Now Playing Movies" items={moviesNowPlaying} />
        <MediaCarousel title="Now Playing Series" items={seriesNowPlaying} />
        <MediaCarousel title="Popular Movies" items={moviesPopular} />
        <MediaCarousel title="Popular Series" items={seriesPopular} />
        <MediaCarousel title="Top Rated Movies" items={moviesTopRated} />
        <MediaCarousel title="Top Rated Series" items={seriesTopRated} />
        {trendingCountryData.length > 0 && (
          <MediaCarousel title={`Trending: ${userCountry} Top 20`} items={trendingCountryData} />
        )}
        {globalTop20.length > 0 && (
          <MediaCarousel title="Global Top 20" items={globalTop20} />
        )}
        {session && userHistory.length > 0 && (
          <MediaCarousel title="Recently Viewed" items={userHistory} />
        )}
      </div>
      
      {/* Premium CTA */}
      {!isPremium && (
        <div className="max-w-[1400px] w-full px-4 mx-auto mt-4 mb-4 md:mb-8">
          <Link href="/premium" className="block relative bg-[#1a1d24]/60 backdrop-blur-md hover:bg-[#1a1d24]/80 border border-purple-500/30 hover:border-purple-500/50 rounded-2xl md:rounded-3xl p-6 md:p-10 lg:p-12 transition-all group overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.1)] hover:shadow-[0_0_40px_rgba(168,85,247,0.2)]">
            {/* Subtle Background Glows */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-fuchsia-500/10 blur-[80px] rounded-full pointer-events-none transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/10 blur-[80px] rounded-full pointer-events-none transform -translate-x-1/2 translate-y-1/2" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
              <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3 lg:gap-4 flex-1">
                <span className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-[10px] md:text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)] text-white w-fit">Cinexium Pro</span>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white">
                  Ready for the ultimate experience?
                </h2>
                <p className="text-gray-400 text-sm md:text-base lg:text-lg max-w-2xl">Unlock unlimited collections, custom profile badges, and exclusive premium chat rooms to connect with true cinephiles.</p>
              </div>
              
              <div className="shrink-0 w-full md:w-auto mt-2 md:mt-0">
                <span className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white font-bold px-8 py-3.5 lg:py-4 rounded-xl group-hover:from-purple-400 group-hover:to-fuchsia-500 group-hover:scale-105 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                  Upgrade Now
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        </div>
      )}
    </main>
  );
}
