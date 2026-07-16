'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '../ui/Button';
import { CustomTrailerPlayer, type CustomTrailerPlayerRef } from '@/components/media/CustomTrailerPlayer';

const SaveMediaModal = dynamic(() => import('@/components/collection/SaveMediaModal').then((mod) => mod.SaveMediaModal));
const OverviewDrawer = dynamic(() => import('@/components/media/OverviewDrawer').then((mod) => mod.OverviewDrawer));

export interface MediaItem {
  id: string;
  title: string;
  description: string;
  bannerUrl: string;
  posterUrl?: string;
  type: 'movie' | 'series';
  trailerKey?: string;
  releaseDate?: string | null;
  originalLanguage?: string;
  genres?: any[];
}

interface HeroBannerProps {
  items: MediaItem[];
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ items }) => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const trailerPlayerRef = useRef<CustomTrailerPlayerRef>(null);

  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [isTrailerPlaying, setIsTrailerPlaying] = useState(false);
  const [isTrailerLoading, setIsTrailerLoading] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isCompactHeroLayout, setIsCompactHeroLayout] = useState(false);
  const [trailerKeys, setTrailerKeys] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(items.map((item) => [`${item.type}:${item.id}`, item.trailerKey ?? null]))
  );

  // Auto-scroll logic
  useEffect(() => {
    if (items.length <= 1 || isPlayingTrailer || isSaveModalOpen) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [items.length, isPlayingTrailer, isSaveModalOpen, currentIndex]);

  // Reset index when items change
  useEffect(() => {
    setCurrentIndex(0);
    setIsPlayingTrailer(false);
    setIsTrailerPlaying(false);
    setIsTrailerLoading(false);
    setTrailerKeys(Object.fromEntries(items.map((item) => [`${item.type}:${item.id}`, item.trailerKey ?? null])));
  }, [items]);

  useEffect(() => {
    const syncViewport = () => {
      setIsCompactHeroLayout(window.innerWidth < 1024);
    };

    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndEvent = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }
    if (isRightSwipe) {
      setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
    }
  };

  if (!items || items.length === 0) return null;

  const currentItem = items[currentIndex];
  const currentItemKey = `${currentItem.type}:${currentItem.id}`;
  const currentTrailerKey = trailerKeys[currentItemKey] ?? currentItem.trailerKey ?? null;

  const handleBannerClick = () => {
    router.push(`/${currentItem.type === 'movie' ? 'movie' : 'series'}/${currentItem.id}`);
  };

  const handleTrailerClose = () => {
    setIsPlayingTrailer(false);
    setIsTrailerPlaying(false);
  };

  const handleTrailerButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (isCompactHeroLayout && isPlayingTrailer && trailerPlayerRef.current && currentTrailerKey) {
      trailerPlayerRef.current.togglePlay();
      return;
    }

    if (currentTrailerKey) {
      setIsPlayingTrailer(true);
      return;
    }

    setIsTrailerLoading(true);

    fetch(`/api/media/trailer?type=${currentItem.type === 'movie' ? 'movie' : 'tv'}&id=${currentItem.id}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Failed to load trailer')))
      .then((data) => {
        const trailerKey = data.trailerKey ?? null;
        setTrailerKeys((prev) => ({ ...prev, [currentItemKey]: trailerKey }));

        if (trailerKey) {
          setIsPlayingTrailer(true);
        } else {
          router.push(`/${currentItem.type === 'movie' ? 'movie' : 'series'}/${currentItem.id}`);
        }
      })
      .catch(() => {
        router.push(`/${currentItem.type === 'movie' ? 'movie' : 'series'}/${currentItem.id}`);
      })
      .finally(() => {
        setIsTrailerLoading(false);
      });
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 mt-[104px] pb-6">
      <div
        className="relative w-full flex flex-col sm:block bg-[#16181d] sm:bg-transparent group rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-2xl cursor-pointer sm:h-[calc(100vh-128px)] sm:min-h-[500px]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEndEvent}
        onClick={handleBannerClick}
      >
        {/* Top Image Section (Mobile: relative aspect-video, Desktop: absolute inset-0) */}
        <div className="relative sm:absolute sm:inset-0 w-full aspect-video sm:aspect-auto sm:h-full min-h-[250px] overflow-hidden">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'
                } ${isPlayingTrailer && index === currentIndex ? 'z-20 bg-black' : ''}`}
            >
              {isPlayingTrailer && index === currentIndex && currentTrailerKey ? (
                <div className="absolute inset-0 z-30 bg-black" onClick={(e) => e.stopPropagation()}>
                  <CustomTrailerPlayer
                    ref={trailerPlayerRef}
                    videoId={currentTrailerKey}
                    onClose={handleTrailerClose}
                    onPlayingChange={setIsTrailerPlaying}
                  />
                </div>
              ) : (
                <>
                  <img
                    src={item.bannerUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                  />
                  {/* Gradients only on desktop to make overlaid text readable, softened for better image clarity */}
                  <div className="hidden sm:block absolute inset-0 bg-gradient-to-t from-[#0f1115] via-[#0f1115]/50 to-transparent" />
                  <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-[#0f1115] via-[#0f1115]/20 to-transparent w-2/3" />
                </>
              )}
            </div>
          ))}
        </div>

        {/* Content Section (Mobile: bottom block, Desktop: absolute bottom overlay) */}
        <div className={`relative sm:absolute sm:inset-0 sm:pointer-events-none flex flex-col justify-between sm:justify-end p-5 sm:p-6 lg:p-10 z-10 min-h-[160px] sm:min-h-0 bg-[#16181d] sm:bg-transparent border-t border-white/5 sm:border-none overflow-hidden transition-opacity duration-500 ${isPlayingTrailer ? 'sm:opacity-0 sm:pointer-events-none' : 'opacity-100'}`}>

          {/* Ambient Blurred Background (Mobile Only) */}
          <div className="sm:hidden absolute inset-0 transition-opacity duration-500 ease-in-out pointer-events-none opacity-100">
            <img
              src={currentItem.bannerUrl}
              alt="Decorative blurred background for banner"
              className="w-full h-full object-cover blur-3xl scale-125 opacity-70"
              loading="eager"
            />
            <div className="absolute inset-0 bg-[#0f1115]/75" />
          </div>

          <div
            className="relative z-10 animate-fade-in-up w-full max-w-4xl sm:pointer-events-auto flex flex-col h-full justify-between sm:justify-end"
            style={{ animation: 'fadeInUp 0.8s ease-out forwards' }}
          >
            <div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-1.5 sm:mb-2 drop-shadow-lg leading-tight line-clamp-1 sm:line-clamp-none">
                {currentItem.title}
              </h1>
              {/* Desktop description (Manual Truncation inline) */}
              <div className="hidden sm:block mb-4 h-[84px] relative">
                <p className="text-gray-300 text-lg drop-shadow-md leading-[28px] inline">
                  {currentItem.description.length > 220 
                    ? `${currentItem.description.substring(0, 220).trim()}...` 
                    : currentItem.description}
                </p>
                {currentItem.description.length > 220 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsOverviewOpen(true); }}
                    className="text-primary-500 font-bold text-[15px] hover:text-primary-400 transition-colors inline ml-2"
                  >
                    Read More
                  </button>
                )}
              </div>

              {/* Mobile description (Manual Truncation inline) */}
              <div className="sm:hidden mb-4 min-h-[66px]">
                <p className="text-gray-300 text-sm drop-shadow-md leading-[22px] inline">
                  {currentItem.description.length > 115 
                    ? `${currentItem.description.substring(0, 115).trim()}...` 
                    : currentItem.description}
                </p>
                {currentItem.description.length > 115 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsOverviewOpen(true); }}
                    className="text-primary-500 font-bold text-[13px] hover:text-primary-400 transition-colors inline ml-1.5"
                  >
                    Read More
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-row items-center gap-2 sm:gap-4 mt-auto sm:mt-0">
              <Button
                variant="primary"
                className="gap-2 justify-center !rounded-full !w-10 !h-10 sm:!w-auto sm:!h-auto !p-0 sm:!py-3 sm:!px-6 !text-xs sm:!text-base"
                onClick={handleTrailerButtonClick}
                aria-label={
                  isCompactHeroLayout && isPlayingTrailer && currentTrailerKey
                    ? (isTrailerPlaying ? 'Pause trailer' : 'Play trailer')
                    : 'Watch trailer'
                }
                disabled={isTrailerLoading}
              >
                {isTrailerLoading ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-90" fill="currentColor" d="M12 2a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7V2z" />
                  </svg>
                ) : isCompactHeroLayout && isPlayingTrailer && isTrailerPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                    <path fillRule="evenodd" d="M6.75 5.25A2.25 2.25 0 0 0 4.5 7.5v9a2.25 2.25 0 0 0 4.5 0v-9a2.25 2.25 0 0 0-2.25-2.25Zm10.5 0A2.25 2.25 0 0 0 15 7.5v9a2.25 2.25 0 0 0 4.5 0v-9a2.25 2.25 0 0 0-2.25-2.25Z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="hidden sm:inline">Watch Trailer</span>
              </Button>
              <Button
                variant="glass"
                className="gap-2 text-white justify-center !rounded-full border-white/20 hover:bg-white/10 !w-10 !h-10 sm:!w-auto sm:!h-auto !p-0 sm:!py-3 sm:!px-6 !text-xs sm:!text-base"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSaveModalOpen(true);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="hidden sm:inline">Add to Collection</span>
              </Button>

              {/* Mobile Carousel Indicators (Hidden on desktop) */}
              <div
                className="flex sm:hidden ml-auto gap-1.5 px-1 sm:pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {items.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(index);
                    }}
                    className={`transition-all duration-300 rounded-full ${index === currentIndex ? 'w-4 h-1.5 bg-primary-500' : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/50'
                      }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Carousel Indicators (Hidden on mobile) */}
        <div
          className="hidden sm:flex absolute bottom-6 right-6 lg:bottom-10 lg:right-10 z-10 gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 sm:pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`transition-all duration-300 rounded-full ${index === currentIndex ? 'w-6 h-2 bg-primary-500' : 'w-2 h-2 bg-white/40 hover:bg-white/80'
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}} />
      </div>

      <SaveMediaModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        mediaId={currentItem.id}
        mediaType={currentItem.type}
      />
      <OverviewDrawer
        isOpen={isOverviewOpen}
        onClose={() => setIsOverviewOpen(false)}
        title={currentItem.title}
        overview={currentItem.description}
      />
    </div>
  );
};
