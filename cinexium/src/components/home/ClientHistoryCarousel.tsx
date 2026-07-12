'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { MediaItem } from './HeroBanner';

interface ClientHistoryCarouselProps {
  title: string;
  initialItems: MediaItem[];
  initialNextCursor: number | null;
}

export const ClientHistoryCarousel: React.FC<ClientHistoryCarouselProps> = ({ title, initialItems, initialNextCursor }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  const [cursor, setCursor] = useState<number | null>(initialNextCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchMoreHistory = useCallback(async () => {
    if (isLoadingMore || cursor === null) return;
    
    setIsLoadingMore(true);
    try {
      const res = await fetch(`/api/user/history/list?cursor=${cursor}`);
      if (!res.ok) throw new Error('Failed to fetch history');
      
      const data = await res.json();
      
      // Filter out items that are already in the list to prevent dupes in UI
      const newItems = data.items.filter((newItem: MediaItem) => 
        !items.some(existing => existing.id === newItem.id && existing.type === newItem.type)
      );
      
      setItems(prev => [...prev, ...newItems]);
      setCursor(data.nextCursor);
    } catch (error) {
      console.error('Error fetching more history:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursor, isLoadingMore, items]);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);

      // Trigger fetch more if scrolled near the end (within 300px)
      if (scrollWidth - (scrollLeft + clientWidth) < 300) {
        fetchMoreHistory();
      }
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [items]);

  if (!items || items.length === 0) return null;

  const scrollLeftAction = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -window.innerWidth / 1.5, behavior: 'smooth' });
    }
  };

  const scrollRightAction = () => {
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
            onClick={scrollLeftAction}
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
            onClick={scrollRightAction}
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
        {isLoadingMore && (
          <div className="snap-start flex-none w-[140px] sm:w-[180px] md:w-[200px] lg:w-[220px] flex items-center justify-center">
             <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      </div>
    </section>
  );
};
