import { MediaItem } from '@/components/home/HeroBanner';
import { cache } from 'react';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';

type Category = 'now_playing' | 'popular' | 'top_rated';

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError';
}

async function fetchTmdbJson<T>(url: string, revalidate = 3600, timeoutMs = 10000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      next: { revalidate },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`TMDB request failed with ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

const getRegionFilters = (region: string, type: 'movie' | 'tv') => {
  if (region === 'bollywood') {
    return '&with_original_language=hi';
  } else if (region === 'anime') {
    return '&with_original_language=ja&with_genres=16';
  } else {
    // hollywood
    return '&with_original_language=en&without_genres=16';
  }
};

const getCategoryFilters = (category: Category, type: 'movie' | 'tv') => {
  const dateField = type === 'movie' ? 'primary_release_date' : 'first_air_date';
  
  switch (category) {
    case 'now_playing':
      const today = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(today.getMonth() - 1);
      
      const maxDate = today.toISOString().split('T')[0];
      const minDate = oneMonthAgo.toISOString().split('T')[0];
      
      return `&sort_by=popularity.desc&${dateField}.gte=${minDate}&${dateField}.lte=${maxDate}`;
    
    case 'popular':
      return '&sort_by=popularity.desc';
      
    case 'top_rated':
      // vote_count.gte=500 ensures we don't get obscure 10/10 movies with 1 vote
      return '&sort_by=vote_average.desc&vote_count.gte=500';
      
    default:
      return '';
  }
};

const fetchMediaList = cache(async (type: 'movie' | 'tv', category: Category, region: string): Promise<MediaItem[]> => {
  if (!TMDB_API_KEY) {
    console.warn('TMDB_API_KEY is not set');
    return [];
  }

  const regionFilter = getRegionFilters(region, type);
  const categoryFilter = getCategoryFilters(category, type);
  
  const url = `${TMDB_BASE_URL}/discover/${type}?api_key=${TMDB_API_KEY}&language=en-US&page=1${regionFilter}${categoryFilter}`;
  
  try {
    const data = await fetchTmdbJson<{ results?: any[] }>(url);
    
    return (data.results || [])
      .filter((item: any) => item.poster_path) // Require poster for carousels
      .map((item: any) => ({
        id: item.id.toString(),
        title: item.title || item.name || item.original_title || item.original_name,
        description: item.overview,
        bannerUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : '',
        posterUrl: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
        type: (type === 'movie' ? 'movie' : 'series') as MediaItem['type'],
      }))
      .slice(0, 20);
  } catch (error) {
    if (isAbortError(error)) {
      console.warn(`TMDB request timed out in fetchMediaList (${type}, ${category})`);
    } else {
      console.error(`Error in fetchMediaList (${type}, ${category}):`, error);
    }
    return [];
  }
});

export const tmdb = {
  getTrendingByCountry: cache(async (countryCode: string, region: string): Promise<MediaItem[]> => {
    if (!TMDB_API_KEY) return [];
    try {
      const regionFilter = getRegionFilters(region, 'movie');
      const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&page=1&sort_by=popularity.desc&watch_region=${countryCode}&with_watch_monetization_types=flatrate|free|ads|rent|buy${regionFilter}`;
      const data = await fetchTmdbJson<{ results?: any[] }>(url);
      
      return (data.results || [])
        .filter((item: any) => item.poster_path)
        .map((item: any) => ({
          id: item.id.toString(),
          title: item.title || item.name || item.original_title || item.original_name,
          description: item.overview,
          bannerUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : '',
          posterUrl: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
          type: 'movie' as const,
        }))
        .slice(0, 20);
    } catch (error) {
      if (isAbortError(error)) {
        console.warn(`TMDB request timed out in getTrendingByCountry (${countryCode})`);
      } else {
        console.error(`Error in getTrendingByCountry (${countryCode}):`, error);
      }
      return [];
    }
  }),

  getGlobalTop20: cache(async (): Promise<MediaItem[]> => {
    if (!TMDB_API_KEY) return [];
    try {
      const url = `${TMDB_BASE_URL}/trending/all/day?api_key=${TMDB_API_KEY}&language=en-US`;
      const data = await fetchTmdbJson<{ results?: any[] }>(url);
      
      return (data.results || [])
        .filter((item: any) => item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv'))
        .map((item: any) => ({
          id: item.id.toString(),
          title: item.title || item.name || item.original_title || item.original_name,
          description: item.overview,
          bannerUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : '',
          posterUrl: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
          type: (item.media_type === 'movie' ? 'movie' : 'series') as MediaItem['type'],
        }))
        .slice(0, 20);
    } catch (error) {
      if (isAbortError(error)) {
        console.warn(`TMDB request timed out in getGlobalTop20`);
      } else {
        console.error(`Error in getGlobalTop20:`, error);
      }
      return [];
    }
  }),

  getMovies: (category: Category, region: string) => fetchMediaList('movie', category, region),
  getSeries: (category: Category, region: string) => fetchMediaList('tv', category, region),
  
  // Helper for Hero Banner (interlaced top 10 movies + series)
  getFeaturedHero: cache(async (region: string): Promise<MediaItem[]> => {
    const [movies, series] = await Promise.all([
      fetchMediaList('movie', 'now_playing', region),
      fetchMediaList('tv', 'now_playing', region)
    ]);
    
    // Interlace them
    const combined: MediaItem[] = [];
    const maxLength = Math.max(movies.length, series.length);
    for (let i = 0; i < maxLength; i++) {
      if (movies[i] && movies[i].bannerUrl) combined.push(movies[i]); // Hero requires banner
      if (series[i] && series[i].bannerUrl) combined.push(series[i]); // Hero requires banner
    }
    
    const top10 = combined.slice(0, 10);
    
    // Fetch videos for the top 10 items to get trailers
    const top10WithTrailers = await Promise.all(
      top10.map(async (item) => {
        try {
          const typePath = item.type === 'movie' ? 'movie' : 'tv';
          const data = await fetchTmdbJson<{ videos?: { results?: any[] } }>(
            `${TMDB_BASE_URL}/${typePath}/${item.id}?api_key=${TMDB_API_KEY}&append_to_response=videos`,
            3600,
            4000
          );
          const videos = data.videos?.results || [];
          const trailer = videos.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube') || videos.find((v: any) => v.site === 'YouTube');
          if (trailer) {
            return { ...item, trailerKey: trailer.key };
          }
        } catch (e) {
          if (!isAbortError(e)) {
            console.error(`Failed to fetch trailer for ${item.id}`, e);
          }
        }
        return item;
      })
    );
    
    return top10WithTrailers;
  }),

  // Fetch specific media details by ID
  getMediaDetails: cache(async (type: 'movie' | 'tv', id: string): Promise<MediaItem | null> => {
    if (!TMDB_API_KEY) return null;
    try {
      const item = await fetchTmdbJson<any>(`${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&language=en-US`);
      return {
        id: item.id.toString(),
        title: item.title || item.name || item.original_title || item.original_name,
        description: item.overview,
        bannerUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : '',
        posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
        type: (type === 'movie' ? 'movie' : 'series') as MediaItem['type'],
        releaseDate: item.release_date || item.first_air_date || item.primary_release_date || null,
        originalLanguage: item.original_language,
        genres: item.genres,
      };
    } catch {
      return null;
    }
  }),

  // Fetch exhaustive media details
  getFullMediaDetails: cache(async (type: 'movie' | 'tv', id: string): Promise<any | null> => {
    if (!TMDB_API_KEY) return null;
    try {
      const appendParams = type === 'movie' 
        ? 'credits,videos,recommendations,similar,release_dates,watch/providers' 
        : 'credits,videos,recommendations,similar,content_ratings,watch/providers';
        
      return await fetchTmdbJson<any>(`${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=${appendParams}`, 3600, 5000);
    } catch {
      return null;
    }
  }),

  // Search media
  searchMedia: async (query: string, type: 'movie' | 'tv' | 'multi', region?: string): Promise<MediaItem[]> => {
    if (!TMDB_API_KEY || !query) return [];
    try {
      const data = await fetchTmdbJson<{ results?: any[] }>(
        `${TMDB_BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1`,
        3600,
        3500
      );
      
      let tmdbResults = data.results || [];
      
      if (region) {
        tmdbResults = tmdbResults.filter((item: any) => {
          const isAnime = item.genre_ids?.includes(16);
          if (region === 'bollywood') {
            return item.original_language === 'hi';
          } else if (region === 'anime') {
            return item.original_language === 'ja' && isAnime;
          } else if (region === 'hollywood') {
            return item.original_language === 'en' && !isAnime;
          }
          return true;
        });
      }
      
      return tmdbResults
        .filter((item: any) => item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv' || type !== 'multi')) // Require poster, and filter to movie/tv if multi
        .map((item: any) => ({
          id: item.id.toString(),
          title: item.title || item.name || item.original_title || item.original_name,
          description: item.overview,
          bannerUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : '',
          posterUrl: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
          type: (item.media_type ? (item.media_type === 'movie' ? 'movie' : 'series') : (type === 'movie' ? 'movie' : 'series')) as MediaItem['type'],
          releaseDate: item.primary_release_date || item.first_air_date || null,
        }));
    } catch {
      return [];
    }
  },

  // Discover by Genre ID sorted by release date
  discoverByGenre: async (genreId: string, type: 'movie' | 'tv'): Promise<MediaItem[]> => {
    if (!TMDB_API_KEY) return [];
    
    const dateField = type === 'movie' ? 'primary_release_date' : 'first_air_date';
    const maxDate = new Date().toISOString().split('T')[0];
    const sortFilter = `&sort_by=${dateField}.desc&${dateField}.lte=${maxDate}&vote_count.gte=10`;
    
    const url = `${TMDB_BASE_URL}/discover/${type}?api_key=${TMDB_API_KEY}&language=en-US&page=1&with_genres=${genreId}${sortFilter}`;
    
    try {
      const data = await fetchTmdbJson<{ results?: any[] }>(url);
      
      return (data.results || [])
        .filter((item: any) => item.poster_path) // Require poster
        .map((item: any) => ({
          id: item.id.toString(),
          title: item.title || item.name || item.original_title || item.original_name,
          description: item.overview,
          bannerUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : '',
          posterUrl: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
          type: (type === 'movie' ? 'movie' : 'series') as MediaItem['type'],
          releaseDate: item[dateField],
        }));
    } catch {
      return [];
    }
  },

  // Paginated discover for infinite scroll
  getDiscoverMedia: async (type: 'movie' | 'tv', region: string, page: number = 1, genreId?: string): Promise<MediaItem[]> => {
    if (!TMDB_API_KEY) return [];
    
    let regionFilter = '';
    if (region === 'bollywood') {
      regionFilter = '&with_original_language=hi';
      if (genreId) regionFilter += `&with_genres=${genreId}`;
    } else if (region === 'anime') {
      regionFilter = genreId ? `&with_original_language=ja&with_genres=16,${genreId}` : '&with_original_language=ja&with_genres=16';
    } else {
      if (genreId === '16') {
        regionFilter = '&with_original_language=en&with_genres=16';
      } else if (genreId) {
        regionFilter = `&with_original_language=en&without_genres=16&with_genres=${genreId}`;
      } else {
        regionFilter = '&with_original_language=en&without_genres=16';
      }
    }

    const dateField = type === 'movie' ? 'primary_release_date' : 'first_air_date';
    // Sort by latest released
    const maxDate = new Date().toISOString().split('T')[0];
    const sortFilter = `&sort_by=${dateField}.desc&${dateField}.lte=${maxDate}&vote_count.gte=10`;

    const url = `${TMDB_BASE_URL}/discover/${type}?api_key=${TMDB_API_KEY}&language=en-US&page=${page}${regionFilter}${sortFilter}`;

    try {
      const data = await fetchTmdbJson<{ results?: any[] }>(url);
      
      return (data.results || [])
        .filter((item: any) => item.poster_path) // Require poster
        .map((item: any) => ({
          id: item.id.toString(),
          title: item.title || item.name || item.original_title || item.original_name,
          description: item.overview,
          bannerUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : '',
          posterUrl: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
          type: (type === 'movie' ? 'movie' : 'series') as MediaItem['type'],
          releaseDate: item.release_date || item.first_air_date || '',
        }));
    } catch {
      return [];
    }
  }
};
