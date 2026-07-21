'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MediaItem } from './HeroBanner';

type ToggleOption = 'movie' | 'series';

interface ToggleMediaCarouselProps {
  title: string;
  movies: MediaItem[];
  series: MediaItem[];
}

export const ToggleMediaCarousel: React.FC<ToggleMediaCarouselProps> = ({
  title,
  movies,
  series,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedType, setSelectedType] = useState<ToggleOption>('movie');
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const items = selectedType === 'movie' ? movies : series;

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'auto' });
    }
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [items]);

  if ((!movies || movies.length === 0) && (!series || series.length === 0)) {
    return null;
  }

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

  return (
    <section className="py-6 sm:py-8 pl-4 sm:pl-6 lg:pl-8">
      <div className="mb-4 sm:mb-6 flex items-center justify-between gap-4 pr-4 sm:pr-6 lg:pr-8">
        <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>

        <div className="relative inline-grid grid-cols-2 items-center rounded-full border border-white/10 bg-white/5 p-1 text-xs sm:text-sm overflow-hidden">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1 bottom-1 rounded-full bg-primary-500 shadow-lg shadow-primary-500/30 transition-all duration-300 ease-out"
            style={{
              width: 'calc(50% - 0.25rem)',
              left: selectedType === 'movie' ? '0.25rem' : 'calc(50%)',
            }}
          />
          <button
            type="button"
            onClick={() => setSelectedType('movie')}
            className={`relative z-10 min-w-[86px] rounded-full px-3 py-1.5 text-sm font-black transition-colors duration-300 ${
              selectedType === 'movie'
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
            style={{ WebkitTextStroke: '0.45px rgba(255,255,255,0.95)' }}
          >
            Movies
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('series')}
            className={`relative z-10 min-w-[86px] rounded-full px-3 py-1.5 text-sm font-black transition-colors duration-300 ${
              selectedType === 'series'
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
            style={{ WebkitTextStroke: '0.45px rgba(255,255,255,0.95)' }}
          >
            TV Shows
          </button>
        </div>
      </div>

      <div className="relative group/carousel">
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="hidden lg:flex absolute left-0 top-0 bottom-12 z-20 w-14 bg-gradient-to-r from-background to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 items-center justify-start hover:text-primary-500"
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
            className="hidden lg:flex absolute right-0 top-0 bottom-12 z-20 w-14 bg-gradient-to-l from-background to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 items-center justify-end hover:text-primary-500 pr-2"
            aria-label="Scroll right"
          >
            <svg className="w-10 h-10 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pr-4 sm:pr-6 lg:pr-8 no-scrollbar scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item, index) => (
            <Link
              key={`${selectedType}-${item.id}-${item.type}-${index}`}
              href={`/${item.type === 'movie' ? 'movie' : 'series'}/${item.id}`}
              className="snap-start flex-none w-[140px] sm:w-[180px] md:w-[200px] lg:w-[220px] group cursor-pointer relative"
            >
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2 bg-[#1a1d24]">
                <div
                  className="absolute top-2 left-2 z-10 text-2xl sm:text-3xl md:text-5xl font-black drop-shadow-md select-none"
                  style={{
                    WebkitTextStroke: '1.5px var(--color-primary-500)',
                    color: 'transparent',
                  }}
                >
                  {index + 1}
                </div>
                {item.posterUrl ? (
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs text-center p-2">
                    No Image
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                  <span className="text-white text-xs sm:text-sm font-semibold truncate block w-full text-center">
                    View Details
                  </span>
                </div>
              </div>

              <h3 className="text-gray-200 text-sm sm:text-base font-medium truncate group-hover:text-primary-500 transition-colors">
                {item.title}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
