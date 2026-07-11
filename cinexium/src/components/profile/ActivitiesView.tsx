'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export const ActivitiesView = () => {
  const [likes, setLikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch('/api/user/activities');
        if (res.ok) {
          const data = await res.json();
          setLikes(data.likes || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-white/10 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (likes.length === 0) {
    return <p className="text-gray-400 p-4">You haven't liked any collections yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {likes.map((like) => (
        <Link 
          key={like.id} 
          href={`/collection/${like.collection.id}`}
          className="flex items-center gap-4 p-3 bg-black/50 border border-white/5 rounded-xl hover:bg-black/70 transition-colors"
        >
          {like.collection.thumbnail ? (
            <img src={like.collection.thumbnail} alt="" className="w-16 h-16 rounded-lg object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center text-gray-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" /></svg>
            </div>
          )}
          <div>
            <h3 className="text-white font-bold">{like.collection.name}</h3>
            <p className="text-sm text-gray-400 truncate w-48 sm:w-64">
              {like.collection.description || 'No description'}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
};
