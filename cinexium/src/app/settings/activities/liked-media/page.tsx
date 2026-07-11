import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ClientBackButton } from '@/components/ui/ClientBackButton';
import { tmdb } from '@/lib/tmdb';

export default async function LikedMediaPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) redirect('/login');

  const likedMediaRows = await prisma.mediaLike.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  });

  // Fetch TMDB details for each liked media
  const mediaItems = await Promise.all(
    likedMediaRows.map(async (row) => {
      const details = await tmdb.getMediaDetails(row.mediaType as 'movie' | 'tv', row.mediaId);
      return {
        ...row,
        details
      };
    })
  );

  const validItems = mediaItems.filter(item => item.details !== null);

  return (
    <div className="min-h-screen pt-4 md:pt-24 pb-24 px-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <ClientBackButton />
        <h1 className="text-xl md:text-3xl font-bold text-white">Liked Media</h1>
      </div>

      <div className="space-y-4">
        {validItems.length === 0 ? (
          <div className="text-center py-12 bg-[#1a1d24] rounded-2xl border border-white/5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-500 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
            <h3 className="text-lg font-medium text-white mb-2">No liked movies or series</h3>
            <p className="text-gray-400">Media you like will appear here.</p>
          </div>
        ) : (
          validItems.map((item) => (
            <Link key={item.id} href={`/${item.mediaType}/${item.mediaId}`} className="flex items-center gap-4 p-4 bg-[#1a1d24] rounded-2xl border border-white/5 hover:border-primary-500/50 transition-colors group">
              <div className="w-16 h-24 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                {item.details?.posterUrl ? (
                  <img src={item.details.posterUrl} alt={item.details.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-gray-600">
                      <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate group-hover:text-primary-400 transition-colors">{item.details?.title}</h3>
                <p className="text-sm text-gray-400 truncate capitalize">{item.mediaType}</p>
              </div>
              <div className="text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:text-primary-500 transition-colors">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
