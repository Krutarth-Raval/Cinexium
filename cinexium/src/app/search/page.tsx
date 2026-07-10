'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from 'use-debounce';
import Link from 'next/link';

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
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 500);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchData | null>(null);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults(null);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/global-search?q=${encodeURIComponent(debouncedQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const hasSearchStarted = query.length > 0 || isFocused;

  return (
    <main className="min-h-screen bg-[#0f1115] pt-20 pb-24 md:pb-0 overflow-hidden relative">
      
      {/* Search Bar Container */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 relative z-40 mt-4 sm:mt-8 mb-8">
        <div className="relative flex items-center bg-[#1a1d24] rounded-2xl sm:rounded-full border border-white/10 focus-within:border-primary-500/50 p-1 sm:p-2 transition-colors duration-300 shadow-sm">
          <div className="pl-4 sm:pl-6 pr-2 sm:pr-3 text-gray-500 focus-within:text-primary-500 transition-colors">
            <svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search movies, series, users, collections..."
            className="flex-1 bg-transparent text-white text-base sm:text-xl px-2 py-3 sm:py-4 outline-none placeholder:text-gray-500 font-normal w-full"
          />
          <AnimatePresence>
            {query && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setQuery('')}
                className="pr-4 sm:pr-6 pl-2 text-gray-500 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

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
  if (!items || items.length === 0) return null;

  return (
    <section className="pl-4 sm:pl-6 lg:pl-8">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">{title}</h2>
      <div 
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pr-4 sm:pr-6 lg:pr-8 no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => {
          const href = item.url || `/${item.type === 'movie' ? 'movies' : 'series'}/${item.id}`;
          
          return (
            <Link 
              key={item.id} 
              href={href}
              className="snap-start flex-none w-[140px] sm:w-[180px] md:w-[200px] group cursor-pointer"
            >
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-[#1a1d24] to-[#13151a] border border-white/10 group-hover:border-primary-500/50 shadow-lg group-hover:shadow-primary-500/20 transition-all duration-300">
                {item.posterUrl ? (
                  <img 
                    src={item.posterUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-gray-400 p-4 text-center">
                    {item.type === 'user' && (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-red-800 flex items-center justify-center text-white text-2xl font-bold mb-2">
                        {item.title.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {item.type === 'collection' && (
                      <svg className="w-12 h-12 mb-2 text-primary-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    )}
                    {item.type === 'group' && (
                      <svg className="w-12 h-12 mb-2 text-primary-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    )}
                    {!['user', 'collection', 'group'].includes(item.type) && 'No Image'}
                  </div>
                )}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <span className="text-white text-sm font-semibold truncate block w-full text-center">
                    View
                  </span>
                </div>
              </div>
              
              <h3 className="text-gray-200 text-sm sm:text-base font-medium truncate group-hover:text-primary-500 transition-colors">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-gray-500 text-xs truncate mt-0.5">
                  {item.description}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
};
