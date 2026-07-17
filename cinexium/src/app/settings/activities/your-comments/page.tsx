import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { tmdb } from '@/lib/tmdb';
import { ClientBackButton } from '@/components/ui/ClientBackButton';
import { CommentActivityList } from '@/components/activities/CommentActivityList';

export default async function YourCommentsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) redirect('/login');

  const comments = await prisma.mediaComment.findMany({
    where: { userId: user.id },
    include: {
      user: {
        select: { username: true, avatar: true }
      },
      _count: {
        select: { likes: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const commentItems = await Promise.all(
    comments.map(async (comment) => {
      const details = await tmdb.getMediaDetails(comment.mediaType as 'movie' | 'tv', comment.mediaId);
      return {
        id: comment.id,
        mediaId: comment.mediaId,
        mediaType: comment.mediaType,
        content: comment.content,
        gifUrl: comment.gifUrl,
        createdAt: comment.createdAt,
        likeCount: comment._count.likes,
        mediaTitle: details?.title || 'Unknown Media',
        username: comment.user.username,
        avatar: comment.user.avatar
      };
    })
  );

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 pt-4 md:pt-24 pb-24">
      <div className="flex items-center gap-4 mb-8">
        <ClientBackButton />
        <h1 className="text-xl md:text-3xl font-bold text-white">Your Comments</h1>
      </div>

      <CommentActivityList
        initialData={commentItems}
        mode="own"
        emptyDescription="Comments you post will appear here."
      />
    </div>
  );
}
