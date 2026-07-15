'use client';

import React from 'react';
import Link from 'next/link';

export const ActivitiesView = () => {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/settings/activities/liked-content"
        className="flex items-center justify-between rounded-xl border border-white/5 bg-black/50 p-4 transition-colors hover:bg-black/70"
      >
        <div>
          <h3 className="font-bold text-white">Liked Content</h3>
          <p className="text-sm text-gray-400">Collections, media, and comments you liked.</p>
        </div>
        <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </Link>

      <Link
        href="/settings/activities/your-comments"
        className="flex items-center justify-between rounded-xl border border-white/5 bg-black/50 p-4 transition-colors hover:bg-black/70"
      >
        <div>
          <h3 className="font-bold text-white">Your Comments</h3>
          <p className="text-sm text-gray-400">Manage the comments you have posted.</p>
        </div>
        <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </Link>
    </div>
  );
};
