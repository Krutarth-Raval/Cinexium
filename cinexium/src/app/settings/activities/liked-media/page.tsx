import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ClientBackButton } from '@/components/ui/ClientBackButton';
import { tmdb } from '@/lib/tmdb';
import { LikedMediaGrid } from '@/components/activities/LikedMediaGrid';

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
      <LikedMediaGrid initialData={validItems} />
    </div>
  );
}
