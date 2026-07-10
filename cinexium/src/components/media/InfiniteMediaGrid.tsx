'use client';

import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import Link from 'next/link';

const formatGenreName = (genre: string) => {
  return genre.toLowerCase().replace(' ', '-').replace("'", "");
};

export const InfiniteMediaGrid = ({ type, title, region = 'hollywood' }: { type: 'movie' | 'tv', title: string, region?: string }) => {
  // Discovery State
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('');

  // Search State
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);

  // Mobile Genre Menu State
  const [isMobileGenreOpen, setIsMobileGenreOpen] = useState(false);
  const [showRadial, setShowRadial] = useState(false);

  useEffect(() => {
    if (isMobileGenreOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => setShowRadial(true), 50);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = 'unset';
      setShowRadial(false);
    }
  }, [isMobileGenreOpen]);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '400px' // Load when 400px away from bottom
  });

  const genres = ['All', 'Action', 'Comedy', 'Drama', 'Sci-Fi', 'Horror', 'Romance', 'Thriller', 'Animation', 'Documentary'];

  // 1. Fetch Discovery Items (Infinite Scroll)
  const loadMoreItems = async (pageToLoad: number) => {
    try {
      const genreParam = selectedGenre ? `&genre=${encodeURIComponent(selectedGenre)}` : '';
      const res = await fetch(`/api/discover?type=${type}&page=${pageToLoad}${genreParam}`);
      const data = await res.json();

      if (data.results && data.results.length > 0) {
        setItems(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          const newItems = data.results.filter((item: any) => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load items', error);
      setHasMore(false);
    }
  };

  useEffect(() => {
    if (submittedQuery) return; // Do not load discovery if searching
    setItems([]);
    setPage(1);
    setHasMore(true);
    // Passing a dummy function or relying on re-render works because loadMoreItems captures the current selectedGenre. 
    // However, to be safe from race conditions, we can just fetch here directly or wait for the next render.
    // Actually, loadMoreItems is re-created every render, so it has the latest selectedGenre.
    loadMoreItems(1);
  }, [type, submittedQuery, selectedGenre]);

  useEffect(() => {
    if (inView && hasMore && !submittedQuery) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadMoreItems(nextPage);
    }
  }, [inView, hasMore, submittedQuery]);

  // 2. Fetch Search Results
  useEffect(() => {
    if (!submittedQuery) {
      setSearchResults([]);
      setDidYouMean(null);
      return;
    }

    const fetchSearchResults = async () => {
      setSearchLoading(true);
      setDidYouMean(null);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(submittedQuery)}&type=${type}`);
        const data = await res.json();
        
        if (data.didYouMean) {
          setDidYouMean(data.didYouMean);
        }
        
        setSearchResults(data.results ? data.results.slice(0, 20) : []);
      } catch (error) {
        console.error('Failed to search', error);
      } finally {
        setSearchLoading(false);
      }
    };

    fetchSearchResults();
  }, [submittedQuery, type]);

  const handleGenreClick = (genre: string) => {
    if (genre === 'All') {
      setSelectedGenre('');
      setQuery('');
      setSubmittedQuery('');
    } else {
      setSelectedGenre(genre);
      setQuery('');
      setSubmittedQuery('');
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSelectedGenre('');
    setSubmittedQuery(query);
  };

  const isSearching = submittedQuery.length > 0;
  const currentItems = isSearching ? searchResults : items;
  const showSpinner = isSearching ? searchLoading : (hasMore && !isSearching);

  return (
    <div className={`min-h-screen px-4 md:px-8 w-full flex flex-col items-center transition-all duration-700 ease-in-out ${isSearching ? 'pt-24 pb-20 md:pb-8 justify-start' : 'justify-start pt-24 pb-32'}`}>
      
      {/* Desktop Title & Search Bar Row */}
      <div className={`w-full flex flex-col md:flex-row items-center gap-6 mb-8 transition-all duration-700 ease-in-out mt-4 ${!isSearching ? 'justify-between' : 'justify-center'}`}>
        
        {/* Desktop Title */}
        {!isSearching && (
          <div className="hidden md:block flex-shrink-0">
            <h1 className="text-4xl lg:text-5xl font-black text-primary-500 uppercase tracking-wider drop-shadow-[0_0_15px_rgba(229,9,20,0.5)]">{title}</h1>
          </div>
        )}

        {/* Search Bar Area */}
        <form onSubmit={handleSubmit} className={`relative transition-all duration-700 ease-in-out transform w-full ${!isSearching ? 'max-w-3xl md:max-w-xl lg:max-w-3xl' : 'max-w-3xl'}`}>
          <button type="submit" className="absolute inset-y-0 left-0 pl-4 md:pl-6 flex items-center text-gray-400 hover:text-primary-500 transition-colors">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </button>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search for ${type === 'movie' ? 'movies' : 'series'}...`}
            className="w-full bg-[#1a1d24] border border-white/10 rounded-[32px] py-3 md:py-4 pl-12 md:pl-16 pr-[90px] md:pr-[140px] text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors shadow-2xl text-base md:text-lg"
          />
          
          <div className="absolute inset-y-0 right-0 pr-1 md:pr-1.5 flex items-center gap-2">
            {query && (
              <button 
                type="button"
                onClick={() => { setQuery(''); setSubmittedQuery(''); }}
                className="text-gray-400 hover:text-white p-2"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            )}
            
            {!isSearching && (
              <button 
                type="button"
                onClick={() => setIsMobileGenreOpen(true)}
                className={`flex items-center justify-center gap-2 w-11 h-11 md:w-auto md:h-auto md:px-4 md:py-2 rounded-full transition-all text-sm md:text-base font-medium shadow-md flex-shrink-0 ${
                  selectedGenre
                    ? 'bg-primary-500 text-white border border-primary-500'
                    : 'bg-[#111318] hover:bg-primary-500/20 text-gray-300 hover:text-primary-500 border border-white/10 hover:border-primary-500/50'
                }`}
              >
                <svg className="w-5 h-5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                <span className="hidden md:block tracking-wide">{selectedGenre || 'Genres'}</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Did You Mean */}
      <div className={`w-full max-w-3xl px-6 flex items-center transition-all duration-500 overflow-hidden ${didYouMean && isSearching && !searchLoading && searchResults.length < 5 ? 'h-6 mb-4 opacity-100' : 'h-0 mb-0 opacity-0'}`}>
        {didYouMean && (
          <p className="text-gray-400 text-sm">
            Did you mean: <button onClick={() => { setQuery(didYouMean); setSubmittedQuery(didYouMean); }} className="text-primary-500 hover:underline font-medium italic">"{didYouMean}"</button>
          </p>
        )}
      </div>

      {/* Unified Genre Overlay (Full Width Bottom Sheet) */}
      <div 
        className={`fixed inset-0 z-[60] flex items-end justify-center overflow-hidden touch-none transition-all duration-500 ${isMobileGenreOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
      >
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-500"
          onClick={() => setIsMobileGenreOpen(false)}
        ></div>
        
        <div 
          className={`relative w-full bg-[#111318] border-t border-white/10 rounded-t-[32px] p-6 md:p-10 pb-12 md:pb-12 flex flex-col items-center transition-all duration-500 transform ${showRadial ? 'translate-y-0' : 'translate-y-full'}`}
          style={{ maxHeight: '85vh', overflowY: 'auto' }}
        >
          <div className="w-12 h-1.5 bg-white/20 rounded-full mb-6"></div>
          
          <div className="w-full flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white tracking-wide">Select Genre</h2>
            <button 
              onClick={() => setIsMobileGenreOpen(false)}
              className="bg-white/10 text-white p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <div className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {genres.map((genre, index) => {
              const isActive = (genre === 'All' && !selectedGenre) || selectedGenre === genre;
              const bgImage = `/genres/${type}/${region}/${formatGenreName(genre)}.jpg`;

              return (
                <button
                  key={genre}
                  onClick={() => {
                    handleGenreClick(genre);
                    setIsMobileGenreOpen(false);
                  }}
                  style={{
                    transitionDelay: showRadial ? `${index * 30}ms` : '0ms',
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                  className={`relative w-full h-28 sm:h-32 md:h-40 lg:h-48 rounded-2xl md:rounded-[24px] overflow-hidden border text-sm md:text-xl font-bold tracking-wide transition-all duration-300 flex items-end justify-start p-4 md:p-6 ${
                    isActive 
                      ? 'border-primary-500 shadow-[0_0_15px_rgba(229,9,20,0.4)] scale-[1.02] z-10' 
                      : 'border-white/10 hover:border-white/30 hover:scale-[1.02] z-0'
                  } ${showRadial ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-t transition-colors duration-300 ${isActive ? 'from-primary-900/90 via-black/40' : 'from-black/90 via-black/40'} to-transparent`}></div>
                  <span className={`relative z-10 text-left w-full line-clamp-1 ${isActive ? 'text-white' : 'text-gray-200 drop-shadow-md'}`}>{genre}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Area */}
      <div className={`relative w-full transition-all duration-700 ease-in-out opacity-100 min-h-[300px]`}>
        {isSearching && searchLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {isSearching && !searchLoading && searchResults.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p className="text-xl">No results found for "{submittedQuery}"</p>
          </div>
        )}

        {(!isSearching || (!searchLoading && searchResults.length > 0)) && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 md:gap-6 w-full">
            {currentItems.map((item: any, index) => (
              <Link href={`/${item.type || type}/${item.id}`} key={`${item.id}-${index}`} className="group cursor-pointer flex flex-col gap-2">
                <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-white/5 transition-transform duration-300 group-hover:scale-105 group-hover:border-primary-500/50 bg-[#1a1d24]">
                  <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="w-full px-1">
                  <p className="text-gray-300 font-semibold text-[11px] md:text-sm truncate group-hover:text-primary-500 transition-colors">
                    {item.title}
                  </p>
                  <div className="flex items-center justify-between mt-0.5">
                    {item.releaseDate && (
                      <p className="text-gray-500 text-[10px] md:text-xs">{new Date(item.releaseDate).getFullYear()}</p>
                    )}
                    {isSearching && item.type && item.type !== type && (
                      <p className="text-gray-500 text-[10px] uppercase border border-gray-700 rounded px-1">{item.type}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {showSpinner && !isSearching && (
          <div ref={ref} className="py-12 flex justify-center w-full mt-4">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
};
