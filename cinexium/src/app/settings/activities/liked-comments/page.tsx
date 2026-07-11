import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ClientBackButton } from '@/components/ui/ClientBackButton';
import { tmdb } from '@/lib/tmdb';

export default async function LikedCommentsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) redirect('/login');

  const likedCommentRows = await prisma.mediaCommentLike.findMany({
    where: { userId: user.id },
    include: {
      comment: {
        include: {
          user: { select: { username: true, avatar: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Fetch TMDB details for each comment's media to display the title
  const validItems = await Promise.all(
    likedCommentRows.map(async (row) => {
      const details = await tmdb.getMediaDetails(row.comment.mediaType as 'movie' | 'tv', row.comment.mediaId);
      return {
        ...row,
        mediaDetails: details
      };
    })
  );

  return (
    <div className="min-h-screen pt-4 md:pt-24 pb-24 px-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <ClientBackButton />
        <h1 className="text-xl md:text-3xl font-bold text-white">Liked Comments</h1>
      </div>

      <div className="space-y-4">
        {validItems.length === 0 ? (
          <div className="text-center py-12 bg-[#1a1d24] rounded-2xl border border-white/5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-500 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
            <h3 className="text-lg font-medium text-white mb-2">No liked comments</h3>
            <p className="text-gray-400">Comments you like will appear here.</p>
          </div>
        ) : (
          validItems.map((item) => (
            <Link key={item.id} href={`/${item.comment.mediaType}/${item.comment.mediaId}`} className="block p-4 bg-[#1a1d24] rounded-2xl border border-white/5 hover:border-primary-500/50 transition-colors group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10">
                  {item.comment.user.avatar ? (
                    <img src={item.comment.user.avatar} alt={item.comment.user.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary-500 text-white text-xs font-bold">
                      {item.comment.user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">@{item.comment.user.username}</p>
                  <p className="text-xs text-gray-400 truncate">
                    on <span className="text-primary-400">{item.mediaDetails?.title || 'Unknown Media'}</span>
                  </p>
                </div>
                <div className="text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:text-primary-500 transition-colors">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-300 text-sm line-clamp-3">{item.comment.content}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
