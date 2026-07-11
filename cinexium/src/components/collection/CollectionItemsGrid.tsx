'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export const CollectionItemsGrid = ({ items, isOwner, collectionId, rawItems }: any) => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
      {items.map((item: any, index: number) => {
        const rawItem = rawItems.find((r: any) => parseInt(r.mediaId) === item.id);
        const type = rawItem ? rawItem.mediaType : (item.title ? 'movie' : 'tv');
        
        return (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative group aspect-[2/3] rounded-xl overflow-hidden bg-black/50 border border-white/5 shadow-md hover:border-primary-500/50 hover:shadow-primary-500/20 transition-all duration-300"
          >
            <Link href={`/${type}/${item.id}`}>
              <img 
                src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster'} 
                alt={item.title || item.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 flex flex-col justify-end">
                <h3 className="text-white text-sm font-bold line-clamp-2 leading-tight">
                  {item.title || item.name}
                </h3>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
};
