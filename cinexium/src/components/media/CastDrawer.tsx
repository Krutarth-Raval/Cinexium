'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';

interface CastDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  castId: string | null;
}

const CastMediaCarousel = ({ title, items }: { title: string; items: any[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [items]);

  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -(scrollRef.current.clientWidth * 0.75), behavior: 'smooth' });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: scrollRef.current.clientWidth * 0.75, behavior: 'smooth' });

  if (items.length === 0) return null;

  return (
    <div className="mb-8 relative group/carousel">
      <h4 className="text-lg font-bold text-white mb-4 pl-4 md:pl-6">{title}</h4>
      
      {canScrollLeft && (
        <button 
          onClick={scrollLeft}
          className="hidden md:flex absolute left-0 top-12 bottom-8 z-20 w-12 bg-gradient-to-r from-[#0f1115] to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 items-center justify-start hover:text-primary-500"
        >
          <svg className="w-8 h-8 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {canScrollRight && (
        <button 
          onClick={scrollRight}
          className="hidden md:flex absolute right-0 top-12 bottom-8 z-20 w-12 bg-gradient-to-l from-[#0f1115] to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 items-center justify-end hover:text-primary-500 pr-2"
        >
          <svg className="w-8 h-8 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 px-4 md:px-6 scroll-pl-4 md:scroll-pl-6 no-scrollbar scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item: any) => (
          <Link 
            key={`${item.media_type}-${item.id}`} 
            href={`/${item.media_type === 'movie' ? 'movie' : 'series'}/${item.id}`}
            className="snap-start flex-none w-[130px] flex flex-col gap-2 group cursor-pointer"
          >
            <div className="relative aspect-[2/3] bg-[#252a34] rounded-xl overflow-hidden shadow-lg border border-white/5 group-hover:border-primary-500 transition-colors">
              {item.poster_path ? (
                <img 
                  src={`https://image.tmdb.org/t/p/w185${item.poster_path}`} 
                  alt={item.title || item.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                  <span className="font-bold text-xs text-gray-500">{item.title || item.name}</span>
                </div>
              )}
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-white uppercase tracking-wider">
                {item.media_type === 'movie' ? 'Movie' : 'Series'}
              </div>
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight line-clamp-1 group-hover:text-primary-400 transition-colors text-white">{item.title || item.name}</p>
              <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.character}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export const CastDrawer = ({ isOpen, onClose, castId }: CastDrawerProps) => {
  const [heightState, setHeightState] = useState<'half' | 'full'>('half');
  const [person, setPerson] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const personCacheRef = useRef<Map<string, any>>(new Map());

  // Reset to half when opened
  useEffect(() => {
    if (isOpen) {
      setHeightState('half');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && castId) {
      const cachedPerson = personCacheRef.current.get(castId);
      if (cachedPerson) {
        setPerson(cachedPerson);
        setLoading(false);
        return;
      }

      const controller = new AbortController();
      setLoading(true);
      fetch(`/api/person/${castId}`, { signal: controller.signal })
        .then(res => res.json())
        .then(data => {
          personCacheRef.current.set(castId, data);
          setPerson(data);
          setLoading(false);
        })
        .catch(err => {
          if (err.name !== 'AbortError') {
            console.error(err);
          }
          setLoading(false);
        });

      return () => controller.abort();
    } else {
      setPerson(null);
    }
  }, [isOpen, castId]);

  const handleDragEnd = (e: any, info: any) => {
    if (heightState === 'half') {
      if (info.offset.y < -50 || info.velocity.y < -200) {
        setHeightState('full');
      } else if (info.offset.y > 50 || info.velocity.y > 200) {
        onClose();
      }
    } else {
      if (info.offset.y > 50 || info.velocity.y > 200) {
        setHeightState('half');
      }
    }
  };

  const deduplicateCredits = (credits: any[]) => {
    const unique = new Map();
    credits.forEach((c: any) => {
      if (!unique.has(c.id)) {
        // Deep clone to avoid mutating the original object if merging characters
        unique.set(c.id, { ...c });
      } else {
        const existing = unique.get(c.id);
        if (c.character && existing.character && !existing.character.includes(c.character)) {
          existing.character = `${existing.character} / ${c.character}`;
        }
      }
    });
    return Array.from(unique.values());
  };

  const popularMovies = useMemo(() => {
    if (!person?.combined_credits?.cast) return [];
    const movies = person.combined_credits.cast.filter((c: any) => c.media_type === 'movie' && c.poster_path);
    return deduplicateCredits(movies)
      .sort((a: any, b: any) => b.popularity - a.popularity)
      .slice(0, 10);
  }, [person]);

  const popularSeries = useMemo(() => {
    if (!person?.combined_credits?.cast) return [];
    const series = person.combined_credits.cast.filter((c: any) => c.media_type === 'tv' && c.poster_path);
    return deduplicateCredits(series)
      .sort((a: any, b: any) => b.popularity - a.popularity)
      .slice(0, 10);
  }, [person]);

  const upcoming = useMemo(() => {
    if (!person?.combined_credits?.cast) return [];
    const now = new Date();
    const upcomingCredits = person.combined_credits.cast.filter((c: any) => {
      if (!c.poster_path) return false;
      const dateStr = c.release_date || c.first_air_date;
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return date > now;
    });
    return deduplicateCredits(upcomingCredits)
      .sort((a: any, b: any) => {
        const dateA = new Date(a.release_date || a.first_air_date).getTime();
        const dateB = new Date(b.release_date || b.first_air_date).getTime();
        return dateA - dateB;
      })
      .slice(0, 10);
  }, [person]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (!person) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Failed to load cast details.
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Header Profile */}
        <div className="px-4 md:px-6 py-6 flex flex-col gap-6 border-b border-white/5">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-[#252a34] shrink-0 shadow-xl">
              {person.profile_path ? (
                <img 
                  src={`https://image.tmdb.org/t/p/w300${person.profile_path}`} 
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#252a34] flex items-center justify-center text-gray-500">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">{person.name}</h2>
              
              <div className="flex flex-col gap-2 text-sm text-gray-400">
                {person.birthday && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span>
                      {new Date(person.birthday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      {person.deathday && ` - ${new Date(person.deathday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`}
                    </span>
                  </div>
                )}
                {person.place_of_birth && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span>{person.place_of_birth}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {person.biography && (
            <div className="w-full">
              <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                {person.biography.split('Description above from the Wikipedia')[0].trim()}
              </p>
            </div>
          )}
        </div>

        <div className="py-6">
          <CastMediaCarousel title="Popular Movies" items={popularMovies} />
          <CastMediaCarousel title="Popular Series" items={popularSeries} />
          <CastMediaCarousel title="Upcoming" items={upcoming} />
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (Shared) */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={onClose}
          />

          {/* Mobile Bottom Drawer */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            initial={{ height: '0vh', y: 0 }}
            animate={{ height: heightState === 'half' ? '50vh' : '95vh', y: 0 }}
            exit={{ height: '0vh', y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-[#0f1115]/80 backdrop-blur-xl z-[100] md:hidden rounded-t-[32px] border-t border-white/10 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
          >
            {/* Drag Handle */}
            <div className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing shrink-0">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>
            
            <div className="px-4 pb-4 border-b border-white/5 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-xl text-white">Cast Details</h3>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {renderContent()}
          </motion.div>

          {/* Desktop Right Side Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-4 bottom-4 right-4 w-[500px] bg-[#0f1115]/80 backdrop-blur-xl z-[100] hidden md:flex flex-col border border-white/10 shadow-2xl rounded-[32px] overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#1a1d24]">
              <h3 className="font-bold text-xl text-white">Cast Details</h3>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {renderContent()}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
