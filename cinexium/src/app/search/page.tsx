'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from 'use-debounce';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CollectionQuickActions } from '@/components/collection/CollectionQuickActions';
import { SearchHistoryDrawer, renderHistoryText } from '@/components/ui/SearchHistoryDrawer';
import ConfirmModal from '@/components/ui/ConfirmModal';

// ---------------- Helper for Spellcheck ----------------
const getLevenshteinDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const indicator = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i][j - 1] + 1,
        matrix[i - 1][j] + 1,
        matrix[i - 1][j - 1] + indicator
      );
    }
  }
  return matrix[a.length][b.length];
};

interface SearchResultItem {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  type: string;
  url?: string;
}

interface SearchData {
  movies: SearchResultItem[];
  series: SearchResultItem[];
  users: SearchResultItem[];
  collections: SearchResultItem[];
  groupChats: SearchResultItem[];
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 500);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchData | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    const saved = localStorage.getItem('cinexium_search_history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveToHistory = (term: string) => {
    if (!term.trim() || term.length < 2) return;
    const updated = [term.trim(), ...searchHistory.filter(h => h.toLowerCase() !== term.trim().toLowerCase())].slice(0, 10);
    setSearchHistory(updated);
    localStorage.setItem('cinexium_search_history', JSON.stringify(updated));
  };

  const removeHistoryItem = (term: string) => {
    const updated = searchHistory.filter(h => h !== term);
    setSearchHistory(updated);
    localStorage.setItem('cinexium_search_history', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Clear History',
      message: 'Are you sure you want to clear your search history? This action cannot be undone.',
      confirmText: 'Clear All',
      isDestructive: true,
      onConfirm: () => {
        setSearchHistory([]);
        localStorage.removeItem('cinexium_search_history');
      }
    });
  };
  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/global-search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        saveToHistory(searchQuery);
        
        // Did You Mean typo check
        const cleanQuery = searchQuery.replace(/^(M-|TV-|C-|@)/i, '').trim().toLowerCase();
        let suggestion = null;
        const checkSuggestion = (title?: string) => {
          if (!title) return null;
          const cleanTitle = title.toLowerCase();
          if (cleanTitle !== cleanQuery && !cleanTitle.includes(cleanQuery) && !cleanQuery.includes(cleanTitle)) {
            const distance = getLevenshteinDistance(cleanQuery, cleanTitle);
            if (distance > 0 && distance <= 3) return title;
          }
          return null;
        };
        
        suggestion = checkSuggestion(data.movies?.[0]?.title) || checkSuggestion(data.series?.[0]?.title);
        setDidYouMean(suggestion);
      }
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const hasSearchStarted = query.length > 0 || isFocused;

  return (
    <main className="min-h-screen bg-[#0f1115] pt-4 md:pt-24 pb-24 md:pb-0 overflow-hidden relative">
      
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-500/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
      </div>
      
      {/* Search Bar Container */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 relative z-40 md:mt-8 mb-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 w-full">
            <button 
              onClick={() => router.back()} 
              className="md:hidden flex items-center justify-center w-12 h-12 rounded-full bg-[#13161c]/80 backdrop-blur-xl border border-white/10 text-gray-400 shrink-0 hover:text-white hover:border-white/20 transition-all shadow-lg"
              aria-label="Go back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="relative group flex-1">
              <div className={`relative flex items-center bg-[#13161c]/80 backdrop-blur-xl border transition-all duration-300 rounded-3xl p-1 sm:p-2 shadow-2xl ${isFocused ? 'border-primary-500/50 shadow-[0_0_20px_rgba(220,38,38,0.15)]' : 'border-white/10 hover:border-white/20'}`}>
                <div className="pl-4 sm:pl-5 pr-2 sm:pr-3 text-gray-500 focus-within:text-primary-500 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Press Enter to search movies, series, users..."
                className="flex-1 bg-transparent text-white text-sm sm:text-lg px-2 py-2 sm:py-2.5 outline-none placeholder:text-gray-500 font-normal w-full"
              />
              <AnimatePresence>
                {query && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => {
                      setQuery('');
                      setResults(null);
                    }}
                    className="pr-4 sm:pr-5 pl-2 text-gray-500 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            
            {/* Did you mean suggestion */}
            {didYouMean && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -bottom-8 left-6 text-sm text-gray-400"
              >
                Did you mean <button onClick={() => { setQuery(didYouMean); handleSearch(didYouMean); }} className="text-primary-500 font-semibold hover:underline italic">{didYouMean}</button>?
              </motion.div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Search Tips Cards */}
      {!results && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl mx-auto px-4 mt-4 sm:mt-12 z-40 relative"
        >
          <h3 className="text-gray-400 mb-6 text-center font-medium tracking-wider text-xs sm:text-sm uppercase">Advanced Search Filters</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { prefix: 'M-', label: 'Movies', icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              ), color: 'text-primary-500', groupHover: 'group-hover:text-primary-400', groupBorder: 'hover:border-primary-500/30' },
              { prefix: 'TV-', label: 'Series', icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ), color: 'text-blue-500', groupHover: 'group-hover:text-blue-400', groupBorder: 'hover:border-blue-500/30' },
              { prefix: '@', label: 'Users', icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              ), color: 'text-green-500', groupHover: 'group-hover:text-green-400', groupBorder: 'hover:border-green-500/30' },
              { prefix: 'C-', label: 'Communities', icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              ), color: 'text-purple-500', groupHover: 'group-hover:text-purple-400', groupBorder: 'hover:border-purple-500/30' },
            ].map((tip) => (
              <button 
                key={tip.prefix}
                onClick={() => setQuery(tip.prefix)}
                className={`flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl border border-white/5 bg-[#13161c]/60 backdrop-blur-md ${tip.groupBorder} hover:bg-white/5 transition-all duration-300 group shadow-lg`}
              >
                <div className={`mb-3 text-gray-500 ${tip.groupHover} transition-colors duration-300`}>
                  {tip.icon}
                </div>
                <span className={`font-bold ${tip.color} mb-1 text-sm sm:text-base tracking-wide`}>{tip.prefix}</span>
                <span className="text-gray-400 text-xs text-center font-medium">{tip.label}</span>
              </button>
            ))}
          </div>

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="mt-8 sm:mt-12 bg-[#13161c]/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 sm:p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                <h3 className="text-gray-400 font-medium tracking-wider text-xs sm:text-sm uppercase flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Recent Searches
                </h3>
                <button 
                  onClick={clearHistory}
                  className="text-xs sm:text-sm text-gray-500 hover:text-red-400 transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {searchHistory.slice(0, 5).map((item, index) => (
                  <div key={index} className="group flex items-center justify-between p-2 sm:p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer" onClick={() => { setQuery(item); handleSearch(item); }}>
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-gray-600 group-hover:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="text-gray-300 group-hover:text-white transition-colors text-sm sm:text-base">{renderHistoryText(item)}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeHistoryItem(item); }}
                      className="text-gray-600 hover:text-red-400 p-1 transition-colors"
                      aria-label="Remove item"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              
              {searchHistory.length > 5 && (
                <div className="mt-4 flex justify-center">
                  <button 
                    onClick={() => setIsDrawerOpen(true)}
                    className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                  >
                    View All
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      <SearchHistoryDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        searchHistory={searchHistory}
        onSelect={(term) => { setQuery(term); handleSearch(term); }}
        onRemove={removeHistoryItem}
        onClear={clearHistory}
      />

      <ConfirmModal 
        {...confirmConfig} 
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} 
      />

      {/* Results Container */}
      <div className="w-full max-w-full mx-auto pb-20 relative z-30">
        {loading && !results && (
          <div className="flex justify-center mt-20">
            <div className="w-10 h-10 border-4 border-white/10 border-t-primary-500 rounded-full animate-spin" />
          </div>
        )}

        {results && (
          <div className="flex flex-col gap-8">
            <ResultRow title="Movies" items={results.movies} />
            <ResultRow title="Series" items={results.series} />
            <ResultRow title="Users" items={results.users} />
            <ResultRow title="Collections" items={results.collections} />
            <ResultRow title="Group Chats" items={results.groupChats} />
            
            {Object.values(results).every(arr => arr.length === 0) && (
              <div className="text-center text-gray-500 mt-20 text-lg">
                No results found for "{query}"
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

// ---------------- Helper Components ----------------


const ResultRow = ({ title, items }: { title: string, items: SearchResultItem[] }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
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
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -window.innerWidth / 1.5, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: window.innerWidth / 1.5, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-2 pl-4 sm:pl-6 lg:pl-8">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">{title}</h2>
      
      <div className="relative group/carousel">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button 
            onClick={scrollLeft}
            className="hidden lg:flex absolute left-0 top-0 bottom-12 z-20 w-14 bg-gradient-to-r from-[#0f1115] to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 items-center justify-start hover:text-primary-500"
            aria-label="Scroll left"
          >
            <svg className="w-10 h-10 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button 
            onClick={scrollRight}
            className="hidden lg:flex absolute right-0 top-0 bottom-12 z-20 w-14 bg-gradient-to-l from-[#0f1115] to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 items-center justify-end hover:text-primary-500 pr-2"
            aria-label="Scroll right"
          >
            <svg className="w-10 h-10 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        <div 
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pr-4 sm:pr-6 lg:pr-8 no-scrollbar scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item) => {
            const href = item.url || `/${item.type === 'movie' ? 'movie' : 'series'}/${item.id}`;
            const isCircular = item.type === 'user' || item.type === 'group';
            
            return (
              <Link 
                key={item.id} 
                href={href}
                className={`snap-start flex-none flex flex-col group cursor-pointer relative ${isCircular ? 'w-[100px] items-center mt-4' : 'w-[140px] sm:w-[180px] md:w-[200px] lg:w-[220px]'}`}
              >
                <div className={`relative overflow-hidden mb-2 bg-[#1a1d24] flex-shrink-0 ${isCircular ? 'w-[100px] h-[100px] rounded-full' : 'aspect-[2/3] w-full rounded-xl'}`}>
                  {item.posterUrl ? (
                    <img 
                      src={item.posterUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className={`w-full h-full flex flex-col items-center justify-center text-gray-500 text-xs text-center ${isCircular ? '' : 'p-2'}`}>
                      {item.type === 'user' && (
                        <div className="w-full h-full bg-gradient-to-br from-primary-500 to-red-800 flex items-center justify-center text-white text-3xl font-bold">
                          {item.title.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {item.type === 'collection' && (
                        <svg className="w-12 h-12 mb-2 text-primary-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      )}
                      {item.type === 'group' && (
                        <svg className="w-10 h-10 text-primary-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      )}
                      {!['user', 'collection', 'group'].includes(item.type) && 'No Image'}
                    </div>
                  )}
                  
                  {/* Hover overlay gradient */}
                  <div className={`absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 ${isCircular ? 'rounded-full items-center justify-center' : ''}`}>
                    {!isCircular && (
                      <span className="text-white font-semibold truncate block w-full text-center text-xs sm:text-sm">
                        View Details
                      </span>
                    )}
                    {item.type === 'collection' && (
                      <CollectionQuickActions collectionId={item.id} />
                    )}
                  </div>
                </div>
                
                <h3 className={`text-gray-200 font-medium truncate group-hover:text-primary-500 transition-colors w-full ${isCircular ? 'text-xs sm:text-sm text-center' : 'text-sm sm:text-base'}`}>
                  {item.type === 'user' ? item.description : item.title}
                </h3>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
