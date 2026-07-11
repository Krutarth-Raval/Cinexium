'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export const ProfileTabs = ({
  myCollections,
  savedCollections
}: {
  myCollections: any[];
  savedCollections: any[];
}) => {
  const [activeTab, setActiveTab] = useState<'my' | 'saved'>('my');

  const activeCollections = activeTab === 'my' ? myCollections : savedCollections;

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="border-t border-white/10 mb-8">
        <div className="flex">
          <button
            onClick={() => setActiveTab('my')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 border-t-2 transition-colors duration-200 ${
              activeTab === 'my'
                ? 'border-white text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
            </svg>
            <span>MY<span className="hidden sm:inline"> COLLECTIONS</span></span>
          </button>
          
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 border-t-2 transition-colors duration-200 ${
              activeTab === 'saved'
                ? 'border-white text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
            </svg>
            <span>SAVED<span className="hidden sm:inline"> COLLECTIONS</span></span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeCollections.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {activeCollections.map((collection: any) => (
                <Link
                  href={`/collection/${collection.id}`}
                  key={collection.id}
                  className="group relative aspect-square overflow-hidden bg-[#1a1d24] rounded-xl border border-white/5 hover:border-white/20 transition-colors"
                >
                  {collection.thumbnail ? (
                    <img
                      src={collection.thumbnail}
                      alt={collection.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#252a34] to-[#1a1d24]">
                      <svg
                        className="w-12 h-12 text-white/20 mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122"
                        />
                      </svg>
                      <span className="text-gray-500 font-medium text-sm">
                        {collection._count?.items || 0} items
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                    <span className="text-white font-bold text-base md:text-lg line-clamp-1">
                      {collection.name}
                    </span>
                    {collection.description && (
                      <span className="text-gray-300 text-xs md:text-sm line-clamp-1 mt-1">
                        {collection.description}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-12">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {activeTab === 'my' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                )}
              </svg>
              <p>{activeTab === 'my' ? 'No collections yet.' : 'No saved collections yet.'}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
