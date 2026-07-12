import React from 'react';
import { tmdb } from '@/lib/tmdb';

export const AuthBackground = async () => {
  // Fetch popular movies and series to create a massive collage
  const [movies, series] = await Promise.all([
    tmdb.getMovies('popular', 'hollywood'),
    tmdb.getSeries('popular', 'hollywood'),
  ]);

  // Combine and double the array to ensure we have enough for a huge screen
  const combined = [...movies, ...series].filter(item => item.posterUrl);
  const repeated = [...combined, ...combined, ...combined].slice(0, 48); // 48 posters

  return (
    <div className="fixed inset-0 overflow-hidden z-0 pointer-events-none bg-[#0f1115]">
      {/* Dense Poster Grid */}
      <div className="absolute inset-0 -top-20 -left-10 -right-10 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 opacity-25 scale-105 transform rotate-3">
        {repeated.map((item, i) => (
          <div key={`auth-bg-${item.id}-${i}`} className="relative aspect-[2/3] rounded-md overflow-hidden bg-gray-900 shadow-xl">
            <img 
              src={item.posterUrl} 
              alt={`Poster for ${item.title}`} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
      
      {/* Dramatic Vignette / Dark Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f1115]/80 via-[#0f1115]/60 to-[#0f1115] z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f1115] via-transparent to-[#0f1115] z-10" />
      <div className="absolute inset-0 bg-[#0f1115]/30 backdrop-blur-[2px] z-10" />
    </div>
  );
};
