'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { MediaItem } from './HeroBanner';

interface MediaCarouselProps {
  title: string;
  items: MediaItem[];
}

export const MediaCarousel: React.FC<MediaCarouselProps> = ({ title, items }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      // Use Math.ceil to avoid sub-pixel rounding issues
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [items]);

  if (!items || items.length === 0) return null;

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
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">{title}</h2>
      
      <div className="relative group/carousel">
        {/* Scroll Buttons - Hidden on mobile/tablet, visible on hover on desktop */}
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

        {/* Scroll Container */}
        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pr-4 sm:pr-6 lg:pr-8 no-scrollbar scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
        {items.map((item, index) => (
          <Link 
            key={`${item.id}-${item.type}-${index}`} 
            href={`/${item.type === 'movie' ? 'movie' : 'series'}/${item.id}`}
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
              {/* Hover overlay gradient */}
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
