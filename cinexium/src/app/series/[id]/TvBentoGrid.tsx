'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';

const CastDrawer = dynamic(() => import('@/components/media/CastDrawer').then((mod) => mod.CastDrawer));
const OverviewDrawer = dynamic(() => import('@/components/media/OverviewDrawer').then((mod) => mod.OverviewDrawer));
const GalleryDrawer = dynamic(() => import('@/components/media/GalleryDrawer').then((mod) => mod.GalleryDrawer));
const SeasonsDrawer = dynamic(() => import('@/components/media/SeasonsDrawer').then((mod) => mod.SeasonsDrawer));
const EpisodeDrawer = dynamic(() => import('@/components/media/EpisodeDrawer').then((mod) => mod.EpisodeDrawer));
const CompanyDrawer = dynamic(() => import('@/components/media/CompanyDrawer').then((mod) => mod.CompanyDrawer));

export const TvBentoGrid = ({ details, region }: { details: any, region?: string }) => {
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = useState<any | null>(null);
  const [seasonData, setSeasonData] = useState<any>(null);
  const [isSeasonsDrawerOpen, setIsSeasonsDrawerOpen] = useState(false);
  const [selectedCastId, setSelectedCastId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const overviewRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  // Scroll states for recommendations
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Scroll states for providers
  const providersScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeftProviders, setCanScrollLeftProviders] = useState(false);
  const [canScrollRightProviders, setCanScrollRightProviders] = useState(true);

  // Scroll states for similar
  const similarScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeftSimilar, setCanScrollLeftSimilar] = useState(false);
  const [canScrollRightSimilar, setCanScrollRightSimilar] = useState(true);

  // Scroll states for cast
  const castScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeftCast, setCanScrollLeftCast] = useState(false);
  const [canScrollRightCast, setCanScrollRightCast] = useState(true);

  // Scroll states for creators
  const creatorsScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeftCreators, setCanScrollLeftCreators] = useState(false);
  const [canScrollRightCreators, setCanScrollRightCreators] = useState(true);

  // Scroll states for production companies
  const productionScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeftProduction, setCanScrollLeftProduction] = useState(false);
  const [canScrollRightProduction, setCanScrollRightProduction] = useState(true);

  // Scroll states for episodes
  const episodesScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeftEpisodes, setCanScrollLeftEpisodes] = useState(false);
  const [canScrollRightEpisodes, setCanScrollRightEpisodes] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  const checkProvidersScroll = () => {
    if (providersScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = providersScrollRef.current;
      setCanScrollLeftProviders(scrollLeft > 0);
      setCanScrollRightProviders(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [details.recommendations]);

  useEffect(() => {
    checkProvidersScroll();
    window.addEventListener('resize', checkProvidersScroll);
    return () => window.removeEventListener('resize', checkProvidersScroll);
  }, [details['watch/providers']]);

  const checkSimilarScroll = () => {
    if (similarScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = similarScrollRef.current;
      setCanScrollLeftSimilar(scrollLeft > 0);
      setCanScrollRightSimilar(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkSimilarScroll();
    window.addEventListener('resize', checkSimilarScroll);
    return () => window.removeEventListener('resize', checkSimilarScroll);
  }, [details.similar]);

  const checkCastScroll = () => {
    if (castScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = castScrollRef.current;
      setCanScrollLeftCast(scrollLeft > 0);
      setCanScrollRightCast(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkCastScroll();
    window.addEventListener('resize', checkCastScroll);
    return () => window.removeEventListener('resize', checkCastScroll);
  }, [seasonData?.credits?.cast, details.credits?.cast]);

  const checkCreatorsScroll = () => {
    if (creatorsScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = creatorsScrollRef.current;
      setCanScrollLeftCreators(scrollLeft > 0);
      setCanScrollRightCreators(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkCreatorsScroll();
    window.addEventListener('resize', checkCreatorsScroll);
    return () => window.removeEventListener('resize', checkCreatorsScroll);
  }, [details.created_by, details.credits?.crew]);

  const checkProductionScroll = () => {
    if (productionScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = productionScrollRef.current;
      setCanScrollLeftProduction(scrollLeft > 0);
      setCanScrollRightProduction(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkProductionScroll();
    window.addEventListener('resize', checkProductionScroll);
    return () => window.removeEventListener('resize', checkProductionScroll);
  }, [details.production_companies]);

  const checkEpisodesScroll = () => {
    if (episodesScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = episodesScrollRef.current;
      setCanScrollLeftEpisodes(scrollLeft > 0);
      setCanScrollRightEpisodes(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkEpisodesScroll();
    window.addEventListener('resize', checkEpisodesScroll);
    return () => window.removeEventListener('resize', checkEpisodesScroll);
  }, [seasonData?.episodes]);

  useEffect(() => {
    const checkTruncation = () => {
      if (overviewRef.current) {
        setIsTruncated(overviewRef.current.scrollHeight > overviewRef.current.clientHeight);
      }
    };
    checkTruncation();
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [details.overview]);

  useEffect(() => {
    const fetchSeason = async () => {
      try {
        const res = await fetch(`/api/tv/${details.id}/season/${selectedSeasonNumber}`);
        if (res.ok) {
          const data = await res.json();
          setSeasonData(data);
        }
      } catch (err) {
        console.error('Failed to fetch season', err);
      }
    };
    fetchSeason();
  }, [selectedSeasonNumber, details.id]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -window.innerWidth / 1.5, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: window.innerWidth / 1.5, behavior: 'smooth' });
    }
  };

  const scrollLeftProviders = () => {
    if (providersScrollRef.current) {
      providersScrollRef.current.scrollBy({ left: -window.innerWidth / 1.5, behavior: 'smooth' });
    }
  };

  const scrollRightProviders = () => {
    if (providersScrollRef.current) {
      providersScrollRef.current.scrollBy({ left: window.innerWidth / 1.5, behavior: 'smooth' });
    }
  };

  const scrollLeftSimilar = () => {
    if (similarScrollRef.current) {
      similarScrollRef.current.scrollBy({ left: -window.innerWidth / 1.5, behavior: 'smooth' });
    }
  };

  const scrollRightSimilar = () => {
    if (similarScrollRef.current) {
      similarScrollRef.current.scrollBy({ left: window.innerWidth / 1.5, behavior: 'smooth' });
    }
  };

  const scrollLeftCast = () => {
    if (castScrollRef.current) {
      castScrollRef.current.scrollBy({ left: -620, behavior: 'smooth' });
    }
  };

  const scrollRightCast = () => {
    if (castScrollRef.current) {
      castScrollRef.current.scrollBy({ left: 620, behavior: 'smooth' });
    }
  };

  const scrollLeftCreators = () => {
    if (creatorsScrollRef.current) {
      creatorsScrollRef.current.scrollBy({ left: -496, behavior: 'smooth' });
    }
  };

  const scrollRightCreators = () => {
    if (creatorsScrollRef.current) {
      creatorsScrollRef.current.scrollBy({ left: 496, behavior: 'smooth' });
    }
  };

  const scrollLeftProduction = () => {
    if (productionScrollRef.current) {
      productionScrollRef.current.scrollBy({ left: -248, behavior: 'smooth' });
    }
  };

  const scrollRightProduction = () => {
    if (productionScrollRef.current) {
      productionScrollRef.current.scrollBy({ left: 248, behavior: 'smooth' });
    }
  };

  const scrollLeftEpisodes = () => {
    if (episodesScrollRef.current) {
      episodesScrollRef.current.scrollBy({ left: -972, behavior: 'smooth' });
    }
  };

  const scrollRightEpisodes = () => {
    if (episodesScrollRef.current) {
      episodesScrollRef.current.scrollBy({ left: 972, behavior: 'smooth' });
    }
  };

  const formatCurrency = (value: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const filterByRegion = (items: any[]) => {
    if (!items || !region) return items || [];
    return items.filter((item: any) => {
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
  };

  const cast = seasonData?.credits?.cast?.slice(0, 20) || details.credits?.cast?.slice(0, 20) || [];
  const recommendations = filterByRegion(details.recommendations?.results).slice(0, 20);
  const similarSeries = filterByRegion(details.similar?.results).slice(0, 20);

  // Creators (Created By, Executive Producers, Writers)
  const createdBy = details.created_by || [];
  const execProducers = details.credits?.crew?.filter((c: any) => c.job === 'Executive Producer') || [];
  const writers = details.credits?.crew?.filter((c: any) => c.job === 'Writer' || c.job === 'Screenplay') || [];
  const creators = [...createdBy.map((c: any) => ({ ...c, job: 'Creator' })), ...execProducers, ...writers].reduce((acc: any[], current: any) => {
    const x = acc.find((item: any) => item.id === current.id);
    if (!x) {
      return acc.concat([{ ...current }]);
    } else {
      if (!x.job.includes(current.job)) {
        x.job = x.job + ', ' + current.job;
      }
      return acc;
    }
  }, []).slice(0, 6);

  const productionCompanies = details.production_companies?.slice(0, 6) || [];

  // Calculate duration formatting
  const runtime = details.episode_run_time?.[0] || details.last_episode_to_air?.runtime || 0;
  const runtimeHours = Math.floor(runtime / 60);
  const runtimeMins = runtime % 60;
  const formattedRuntime = runtime > 0 ? `${runtimeHours > 0 ? `${runtimeHours}h ` : ''}${runtimeMins}m` : 'N/A';

  // Release date for India (or US as fallback)
  let releaseDateString = new Date(details.first_air_date || details.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  let releaseCountry = '';

  if (details.release_dates?.results) {
    const inRelease = details.release_dates.results.find((r: any) => r.iso_3166_1 === 'IN');
    if (inRelease && inRelease.release_dates?.length > 0) {
      const date = new Date(inRelease.release_dates[0].release_date);
      releaseDateString = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
      releaseCountry = ' (IN)';
    } else {
      const usRelease = details.release_dates.results.find((r: any) => r.iso_3166_1 === 'US');
      if (usRelease && usRelease.release_dates?.length > 0) {
        const date = new Date(usRelease.release_dates[0].release_date);
        releaseDateString = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
        releaseCountry = ' (US)';
      }
    }
  }

  // Where to watch providers
  const watchProviders = details['watch/providers']?.results;
  let providerLink = '';
  let providers: any[] = [];

  if (watchProviders) {
    const region = watchProviders['IN'] || watchProviders['US'] || Object.values(watchProviders)[0];
    if (region) {
      providerLink = region.link;
      const allProviders = [...(region.flatrate || []), ...(region.rent || []), ...(region.buy || [])];
      const uniqueProviders = new Map();
      allProviders.forEach(p => {
        if (!uniqueProviders.has(p.provider_id)) {
          uniqueProviders.set(p.provider_id, p);
        }
      });
      providers = Array.from(uniqueProviders.values());
    }
  }

  return (
    <>
      <div className="w-full pt-4 md:pt-16 pb-4 text-white">

        {/* Centered Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 md:px-12 grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Genres, Overview, Ratings, Watch Providers */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="bg-[#1a1d24] border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col gap-6 h-full">

              {/* Genres */}
              <div className="flex sm:flex-wrap overflow-x-auto gap-3 pb-1 sm:pb-0 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {details.genres?.map((g: any) => (
                  <span key={g.id} className="whitespace-nowrap px-5 py-2 bg-[#252a34] border border-white/5 text-gray-300 rounded-full text-sm font-semibold hover:bg-white/10 hover:text-white transition-all cursor-pointer shadow-sm">
                    {g.name}
                  </span>
                ))}
              </div>

              {/* Overview */}
              {details.overview && (
                <div className="relative group">
                  <p
                    ref={overviewRef}
                    className="text-gray-300 text-base md:text-lg leading-relaxed font-medium line-clamp-4 md:line-clamp-3"
                  >
                    {details.overview}
                  </p>
                  {isTruncated && (
                    <div className="absolute bottom-0 right-0 flex items-center">
                      <div className="w-16 h-full bg-gradient-to-r from-transparent to-[#1a1d24]" />
                      <div className="bg-[#1a1d24] flex items-center pt-1 pb-[2px] pl-1 pr-1">
                        <span className="text-gray-300 text-base md:text-lg font-medium leading-none">...&nbsp;</span>
                        <button
                          onClick={() => setIsOverviewOpen(true)}
                          className="text-primary-500 font-bold text-sm md:text-base hover:text-primary-400 transition-colors uppercase tracking-wider"
                        >
                          Read More
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Where to Watch */}
              <div>
                <h3 className="text-gray-400 font-medium text-sm mb-4 uppercase tracking-wider">Available On</h3>
                {providers.length > 0 ? (
                  <div className="relative group/providers">
                    {canScrollLeftProviders && (
                      <button
                        onClick={scrollLeftProviders}
                        className="hidden md:flex absolute left-0 top-0 bottom-6 z-20 w-10 bg-gradient-to-r from-[#1a1d24] via-[#1a1d24]/80 to-transparent opacity-0 group-hover/providers:opacity-100 transition-opacity duration-300 items-center justify-start hover:text-primary-500"
                        aria-label="Scroll providers left"
                      >
                        <svg className="w-8 h-8 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    )}
                    {canScrollRightProviders && (
                      <button
                        onClick={scrollRightProviders}
                        className="hidden md:flex absolute right-0 top-0 bottom-6 z-20 w-10 bg-gradient-to-l from-[#1a1d24] via-[#1a1d24]/80 to-transparent opacity-0 group-hover/providers:opacity-100 transition-opacity duration-300 items-center justify-end hover:text-primary-500"
                        aria-label="Scroll providers right"
                      >
                        <svg className="w-8 h-8 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                    <div
                      ref={providersScrollRef}
                      onScroll={checkProvidersScroll}
                      className="flex gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth pb-2"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {providers.map(provider => (
                        <a
                          key={provider.provider_id}
                          href={providerLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-2 group snap-start shrink-0"
                          title={provider.provider_name}
                        >
                          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary-500 transition-all shadow-lg bg-[#252a34]">
                            <img
                              src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                              alt={provider.provider_name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <span className="text-xs text-gray-400 font-medium group-hover:text-white transition-colors w-[60px] text-center line-clamp-2 leading-tight">
                            {provider.provider_name}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#252a34]/40 border border-white/5 rounded-2xl p-5 flex items-center gap-4 w-full shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-[#1a1d24] flex items-center justify-center shrink-0 border border-white/5">
                      <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm mb-1">Not Streaming Yet</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">Streaming availability is not known for this title yet. Please check back later.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Ratings and Actions */}
              <div className="flex flex-wrap gap-6 items-center mt-auto pt-6 border-t border-white/5 w-full">
                <div>
                  <div className="flex items-center gap-2">
                    <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                    <span className="text-2xl font-bold">{details.vote_average?.toFixed(1)}<span className="text-sm text-gray-500 font-medium">/10</span></span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 font-medium">{details.vote_count?.toLocaleString()} votes</p>
                </div>
                <div className="w-px h-10 bg-white/10 hidden sm:block"></div>
                <div>
                  <div className="flex items-center gap-2">
                    <svg className="w-6 h-6 text-primary-500" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" /></svg>
                    <span className="text-2xl font-bold">{details.popularity?.toFixed(0)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 font-medium">Popularity</p>
                </div>

                <div className="flex items-center gap-3 ml-auto shrink-0">
                  {details.homepage && (
                    <a
                      href={details.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 lg:w-auto lg:h-auto lg:px-4 lg:py-2 bg-[#252a34] hover:bg-[#2a2f3a] text-white rounded-full transition-colors flex items-center justify-center lg:gap-2 border border-white/5"
                      title="Website"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                      <span className="hidden lg:inline text-sm font-semibold">Website</span>
                    </a>
                  )}
                  <button
                    onClick={() => setIsGalleryOpen(true)}
                    className="w-10 h-10 lg:w-auto lg:h-auto lg:px-4 lg:py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-colors flex items-center justify-center lg:gap-2 shadow-lg shadow-primary-500/20"
                    title="Gallery"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="hidden lg:inline text-sm font-semibold">Gallery</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: About Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a1d24] border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-bl-full -z-0"></div>
              <h3 className="text-xl font-bold mb-6 relative z-10 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Series Info
              </h3>

              <div className="grid grid-cols-2 lg:grid-cols-1 gap-y-5 gap-x-4 relative z-10">
                <div className="border-l-2 border-white/10 pl-3">
                  <h4 className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mb-1">Status</h4>
                  <p className="font-semibold text-white">{details.status}</p>
                </div>
                <div className="border-l-2 border-white/10 pl-3">
                  <h4 className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mb-1">Runtime</h4>
                  <p className="font-semibold text-white">{formattedRuntime}</p>
                </div>
                <div className="border-l-2 border-white/10 pl-3">
                  <h4 className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mb-1">Release Date</h4>
                  <p className="font-semibold text-white">{releaseDateString} <span className="text-primary-400 text-xs font-bold">{releaseCountry}</span></p>
                </div>
                <div className="border-l-2 border-white/10 pl-3">
                  <h4 className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mb-1">Language</h4>
                  <p className="font-semibold text-white uppercase">{details.original_language}</p>
                </div>
                <div className="border-l-2 border-white/10 pl-3">
                  <h4 className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mb-1">Seasons</h4>
                  <p className="font-semibold text-white">{details.number_of_seasons}</p>
                </div>
                <div className="border-l-2 border-white/10 pl-3">
                  <h4 className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mb-1">Episodes</h4>
                  <p className="font-semibold text-white">{details.number_of_episodes}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Episodes Section */}
        {seasonData?.episodes && seasonData.episodes.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 md:px-12 mt-16">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                Episodes <span className="text-gray-500 text-lg font-normal ml-2">Season {selectedSeasonNumber}</span>
              </h3>
              <button
                onClick={() => setIsSeasonsDrawerOpen(true)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-semibold transition-colors"
              >
                View All Seasons
              </button>
            </div>
            <div className="relative group/episodes">
              {/* Scroll Buttons */}
              {canScrollLeftEpisodes && (
                <button
                  onClick={scrollLeftEpisodes}
                  className="hidden lg:flex absolute left-0 top-0 bottom-6 z-20 w-14 bg-gradient-to-r from-[#0f1115] to-transparent opacity-0 group-hover/episodes:opacity-100 transition-opacity duration-300 items-center justify-start hover:text-primary-500"
                  aria-label="Scroll left"
                >
                  <svg className="w-10 h-10 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {canScrollRightEpisodes && (
                <button
                  onClick={scrollRightEpisodes}
                  className="hidden lg:flex absolute right-0 top-0 bottom-6 z-20 w-14 bg-gradient-to-l from-[#0f1115] to-transparent opacity-0 group-hover/episodes:opacity-100 transition-opacity duration-300 items-center justify-end hover:text-primary-500 pr-2"
                  aria-label="Scroll right"
                >
                  <svg className="w-10 h-10 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              <div
                ref={episodesScrollRef}
                onScroll={checkEpisodesScroll}
                className="flex gap-4 overflow-x-auto custom-scrollbar pb-6 snap-x scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {seasonData.episodes.map((ep: any) => (
                  <div
                    key={ep.id}
                    onClick={() => setSelectedEpisode(ep)}
                    className="min-w-[280px] max-w-[280px] md:min-w-[320px] md:max-w-[320px] flex flex-col gap-3 group snap-start bg-[#1a1d24] rounded-2xl overflow-hidden border border-white/5 shadow-lg cursor-pointer hover:border-primary-500/50 transition-colors"
                  >
                    <div className="w-full aspect-video bg-[#252a34] relative overflow-hidden">
                      {ep.still_path ? (
                        <img src={`https://image.tmdb.org/t/p/w500${ep.still_path}`} alt={ep.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-bold text-white flex items-center gap-1.5 shadow-lg">
                        <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                        {ep.vote_average?.toFixed(1) || '0.0'}
                      </div>
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-bold text-white shadow-lg">
                        Ep {ep.episode_number}
                      </div>
                    </div>
                    <div className="p-4 pt-1 flex-1 flex flex-col justify-between">
                      <h4 className="font-bold text-white mb-2 line-clamp-2 text-sm leading-snug group-hover:text-primary-400 transition-colors" title={ep.name}>{ep.name}</h4>
                      <p className="text-xs text-gray-500 font-semibold flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {ep.runtime ? `${ep.runtime} min` : 'TBA'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Creators & Production Desktop Layout */}
        {(creators.length > 0 || productionCompanies.length > 0) && (
          <div className="max-w-7xl mx-auto px-4 md:px-12 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column: Creators (All Devices) */}
            {creators.length > 0 && (
              <div className="lg:col-span-2 flex flex-col">
                <h3 className="text-2xl font-bold flex items-center gap-2 mb-6 shrink-0">Creators</h3>

                <div className="relative group/creators flex-1">
                  {canScrollLeftCreators && (
                    <button
                      onClick={scrollLeftCreators}
                      className="hidden lg:flex absolute left-0 top-0 bottom-6 z-20 w-14 bg-gradient-to-r from-[#0f1115] to-transparent opacity-0 group-hover/creators:opacity-100 transition-opacity duration-300 items-center justify-start hover:text-primary-500"
                      aria-label="Scroll left"
                    >
                      <svg className="w-10 h-10 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                  )}
                  {canScrollRightCreators && (
                    <button
                      onClick={scrollRightCreators}
                      className="hidden lg:flex absolute right-0 top-0 bottom-6 z-20 w-14 bg-gradient-to-l from-[#0f1115] to-transparent opacity-0 group-hover/creators:opacity-100 transition-opacity duration-300 items-center justify-end hover:text-primary-500 pr-2"
                      aria-label="Scroll right"
                    >
                      <svg className="w-10 h-10 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  )}

                  <div
                    ref={creatorsScrollRef}
                    onScroll={checkCreatorsScroll}
                    className="flex gap-6 overflow-x-auto custom-scrollbar pb-6 snap-x snap-mandatory scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {creators.map((creator: any) => (
                      <button
                        key={creator.id}
                        onClick={() => setSelectedCastId(creator.id.toString())}
                        className="min-w-[100px] max-w-[100px] flex flex-col items-center gap-3 group snap-start text-center shrink-0"
                      >
                        <div className="w-[100px] h-[100px] bg-[#252a34] rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary-500 transition-all duration-300 shadow-lg shrink-0">
                          {creator.profile_path ? (
                            <img src={`https://image.tmdb.org/t/p/w185${creator.profile_path}`} alt={creator.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm leading-tight line-clamp-1 group-hover:text-primary-400 transition-colors">{creator.name}</p>
                          <p className="text-xs text-primary-500 font-semibold line-clamp-2 leading-snug mt-1">{creator.job}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Right Column: Production Companies (Desktop Only) */}
            <div className="hidden lg:flex flex-col lg:col-span-1">
              <h3 className="text-2xl font-bold flex items-center gap-2 mb-6 shrink-0">Production</h3>

              <div className="relative group/production flex-1">
                {canScrollLeftProduction && (
                  <button
                    onClick={scrollLeftProduction}
                    className="hidden lg:flex absolute left-0 top-0 bottom-6 z-20 w-14 bg-gradient-to-r from-[#0f1115] to-transparent opacity-0 group-hover/production:opacity-100 transition-opacity duration-300 items-center justify-start hover:text-primary-500"
                    aria-label="Scroll left"
                  >
                    <svg className="w-10 h-10 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                )}
                {canScrollRightProduction && (
                  <button
                    onClick={scrollRightProduction}
                    className="hidden lg:flex absolute right-0 top-0 bottom-6 z-20 w-14 bg-gradient-to-l from-[#0f1115] to-transparent opacity-0 group-hover/production:opacity-100 transition-opacity duration-300 items-center justify-end hover:text-primary-500 pr-2"
                    aria-label="Scroll right"
                  >
                    <svg className="w-10 h-10 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
                )}

                <div
                  ref={productionScrollRef}
                  onScroll={checkProductionScroll}
                  className="flex gap-6 overflow-x-auto custom-scrollbar pb-6 snap-x snap-mandatory scroll-smooth"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {productionCompanies.map((company: any) => (
                    <button
                      key={company.id}
                      onClick={() => setSelectedCompanyId(company.id.toString())}
                      className="min-w-[100px] max-w-[100px] flex flex-col items-center gap-3 group snap-start text-center shrink-0"
                    >
                      <div className="w-[96px] h-[96px] bg-white rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary-500 transition-all duration-300 shadow-lg p-3 flex items-center justify-center shrink-0">
                        {company.logo_path ? (
                          <img src={`https://image.tmdb.org/t/p/w185${company.logo_path}`} alt={company.name} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-sm">{company.name.charAt(0)}</div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-tight line-clamp-1 group-hover:text-primary-400 transition-colors text-gray-300">{company.name}</p>
                        {company.origin_country && (
                          <p className="text-xs text-primary-500 font-semibold line-clamp-1 leading-snug mt-1">{company.origin_country}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Top Cast Section */}
        {cast.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 md:px-12 mt-8">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              Top Cast
            </h3>

            <div className="relative group/cast">
              {/* Scroll Buttons */}
              {canScrollLeftCast && (
                <button
                  onClick={scrollLeftCast}
                  className="hidden lg:flex absolute left-0 top-0 bottom-6 z-20 w-14 bg-gradient-to-r from-[#0f1115] to-transparent opacity-0 group-hover/cast:opacity-100 transition-opacity duration-300 items-center justify-start hover:text-primary-500"
                  aria-label="Scroll left"
                >
                  <svg className="w-10 h-10 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {canScrollRightCast && (
                <button
                  onClick={scrollRightCast}
                  className="hidden lg:flex absolute right-0 top-0 bottom-6 z-20 w-14 bg-gradient-to-l from-[#0f1115] to-transparent opacity-0 group-hover/cast:opacity-100 transition-opacity duration-300 items-center justify-end hover:text-primary-500 pr-2"
                  aria-label="Scroll right"
                >
                  <svg className="w-10 h-10 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              <div
                ref={castScrollRef}
                onScroll={checkCastScroll}
                className="flex gap-6 overflow-x-auto custom-scrollbar pb-6 snap-x scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {cast.map((actor: any) => (
                  <button
                    key={actor.id}
                    onClick={() => setSelectedCastId(actor.id.toString())}
                    className="min-w-[100px] max-w-[100px] flex flex-col items-center gap-3 group snap-start text-left"
                  >
                    <div className="w-[100px] h-[100px] bg-[#1a1d24] rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary-500 transition-all duration-300 shadow-lg shrink-0">
                      {actor.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                          alt={actor.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 bg-[#252a34]">
                          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                        </div>
                      )}
                    </div>
                    <div className="text-center w-full">
                      <p className="font-bold text-sm leading-tight line-clamp-1 group-hover:text-primary-400 transition-colors">{actor.name}</p>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-snug mt-1">{actor.character}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Production Companies */}
        {productionCompanies.length > 0 && (
          <div className="lg:hidden max-w-7xl mx-auto px-4 md:px-12 mt-8 flex flex-col gap-6">
            <h3 className="text-2xl font-bold flex items-center gap-2">Production</h3>
            <div className="flex gap-6 overflow-x-auto custom-scrollbar pb-6 snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {productionCompanies.map((company: any) => (
                <button
                  key={company.id}
                  onClick={() => setSelectedCompanyId(company.id.toString())}
                  className="min-w-[100px] max-w-[100px] flex flex-col items-center gap-3 group snap-start text-center shrink-0"
                >
                  <div className="w-[100px] h-[100px] bg-white rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary-500 transition-all duration-300 shadow-lg p-3 flex items-center justify-center shrink-0">
                    {company.logo_path ? (
                      <img src={`https://image.tmdb.org/t/p/w185${company.logo_path}`} alt={company.name} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-sm">{company.name.charAt(0)}</div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm leading-tight line-clamp-1 group-hover:text-primary-400 transition-colors text-gray-300">{company.name}</p>
                    {company.origin_country && (
                      <p className="text-xs text-primary-500 font-semibold line-clamp-1 leading-snug mt-1">{company.origin_country}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Similar Series Section (Full Width) */}
        {similarSeries.length > 0 && (
          <section className="mt-8 pl-4 sm:pl-6 md:pl-12">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              Similar TV Shows
            </h3>

            <div className="relative group/similar">
              {canScrollLeftSimilar && (
                <button
                  onClick={scrollLeftSimilar}
                  className="hidden lg:flex absolute left-0 top-0 bottom-8 z-20 w-14 bg-gradient-to-r from-[#0f1115] to-transparent opacity-0 group-hover/similar:opacity-100 transition-opacity duration-300 items-center justify-start hover:text-primary-500"
                  aria-label="Scroll left"
                >
                  <svg className="w-10 h-10 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {canScrollRightSimilar && (
                <button
                  onClick={scrollRightSimilar}
                  className="hidden lg:flex absolute right-0 top-0 bottom-8 z-20 w-14 bg-gradient-to-l from-[#0f1115] to-transparent opacity-0 group-hover/similar:opacity-100 transition-opacity duration-300 items-center justify-end hover:text-primary-500 pr-2"
                  aria-label="Scroll right"
                >
                  <svg className="w-10 h-10 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              <div
                ref={similarScrollRef}
                onScroll={checkSimilarScroll}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pr-4 sm:pr-6 md:pr-12 no-scrollbar scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {similarSeries.map((series: any, index: number) => (
                  <Link
                    key={series.id}
                    href={`/series/${series.id}`}
                    className="snap-start flex-none w-[140px] sm:w-[180px] md:w-[200px] lg:w-[220px] group cursor-pointer relative"
                  >
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2 bg-[#1a1d24]">
                      {/* Rank Number Overlay */}
                      <div
                        className="absolute top-2 left-2 z-10 text-2xl sm:text-3xl md:text-5xl font-black drop-shadow-md select-none"
                        style={{
                          WebkitTextStroke: '1.5px var(--color-primary-500)',
                          color: 'transparent'
                        }}
                      >
                        {index + 1}
                      </div>
                      {series.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w342${series.poster_path}`}
                          alt={series.name || series.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                          <span className="font-bold text-sm text-gray-500">{series.name || series.title}</span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                        <span className="text-white text-xs sm:text-sm font-semibold truncate block w-full text-center">
                          View Details
                        </span>
                      </div>
                    </div>

                    <h3 className="text-gray-200 text-sm sm:text-base font-medium truncate group-hover:text-primary-500 transition-colors">
                      {series.name || series.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recommendations Section (Full Width) */}
        {recommendations.length > 0 && (
          <section className="mt-8 pl-4 sm:pl-6 md:pl-12">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              You might also like
            </h3>

            <div className="relative group/carousel">
              {/* Scroll Buttons */}
              {canScrollLeft && (
                <button
                  onClick={scrollLeft}
                  className="hidden lg:flex absolute left-0 top-0 bottom-8 z-20 w-14 bg-gradient-to-r from-[#0f1115] to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 items-center justify-start hover:text-primary-500"
                  aria-label="Scroll left"
                >
                  <svg className="w-10 h-10 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {canScrollRight && (
                <button
                  onClick={scrollRight}
                  className="hidden lg:flex absolute right-0 top-0 bottom-8 z-20 w-14 bg-gradient-to-l from-[#0f1115] to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 items-center justify-end hover:text-primary-500 pr-2"
                  aria-label="Scroll right"
                >
                  <svg className="w-10 h-10 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              {/* Scroll Container */}
              <div
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pr-4 sm:pr-6 md:pr-12 no-scrollbar scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {recommendations.map((rec: any, index: number) => (
                  <Link
                    key={rec.id}
                    href={`/series/${rec.id}`}
                    className="snap-start flex-none w-[140px] sm:w-[180px] md:w-[200px] lg:w-[220px] group cursor-pointer relative"
                  >
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2 bg-[#1a1d24]">
                      {/* Rank Number Overlay */}
                      <div
                        className="absolute top-2 left-2 z-10 text-2xl sm:text-3xl md:text-5xl font-black drop-shadow-md select-none"
                        style={{
                          WebkitTextStroke: '1.5px var(--color-primary-500)',
                          color: 'transparent'
                        }}
                      >
                        {index + 1}
                      </div>
                      {rec.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w342${rec.poster_path}`}
                          alt={rec.name || rec.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                          <span className="font-bold text-sm text-gray-500">{rec.name || rec.title}</span>
                        </div>
                      )}

                      {/* Hover overlay gradient */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                        <span className="text-white text-xs sm:text-sm font-semibold truncate block w-full text-center">
                          View Details
                        </span>
                      </div>
                    </div>

                    <h3 className="text-gray-200 text-sm sm:text-base font-medium truncate group-hover:text-primary-500 transition-colors">
                      {rec.name || rec.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
        {/* Back to Top Button */}
        <div className="flex justify-center mt-4 pb-2">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-primary-500 font-bold hover:text-primary-400 transition-colors"
          >
            Back to top
          </button>
        </div>
      </div>

      {/* Drawers */}
      <SeasonsDrawer
        isOpen={isSeasonsDrawerOpen}
        onClose={() => setIsSeasonsDrawerOpen(false)}
        seasons={details.seasons || []}
        selectedSeasonNumber={selectedSeasonNumber}
        onSelectSeason={(seasonNumber) => setSelectedSeasonNumber(seasonNumber)}
      />
      <CastDrawer
        isOpen={!!selectedCastId}
        onClose={() => setSelectedCastId(null)}
        castId={selectedCastId}
      />
      <OverviewDrawer
        isOpen={isOverviewOpen}
        onClose={() => setIsOverviewOpen(false)}
        title="Overview"
        overview={details.overview}
      />
      <CompanyDrawer
        isOpen={!!selectedCompanyId}
        onClose={() => setSelectedCompanyId(null)}
        companyId={selectedCompanyId}
      />
      <GalleryDrawer
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        mediaId={details.id.toString()}
        mediaType="tv"
      />
      <EpisodeDrawer
        isOpen={!!selectedEpisode}
        onClose={() => setSelectedEpisode(null)}
        episode={selectedEpisode}
      />
    </>
  );
};
