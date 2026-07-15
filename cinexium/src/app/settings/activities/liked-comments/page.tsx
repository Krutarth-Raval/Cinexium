import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ClientBackButton } from '@/components/ui/ClientBackButton';
import { tmdb } from '@/lib/tmdb';
import { CommentActivityList } from '@/components/activities/CommentActivityList';

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
          user: { select: { username: true, avatar: true } },
          _count: { select: { likes: true } }
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
        id: row.comment.id,
        mediaId: row.comment.mediaId,
        mediaType: row.comment.mediaType,
        content: row.comment.content,
        createdAt: row.createdAt,
        likeCount: row.comment._count.likes,
        mediaTitle: details?.title || 'Unknown Media',
        username: row.comment.user.username,
        avatar: row.comment.user.avatar
      };
    })
  );

  return (
    <div className="min-h-screen pt-4 md:pt-24 pb-24 px-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <ClientBackButton />
        <h1 className="text-xl md:text-3xl font-bold text-white">Liked Comments</h1>
      </div>

      <CommentActivityList
        initialData={validItems}
        mode="liked"
        emptyDescription="Comments you like will appear here."
      />
    </div>
  );
}
