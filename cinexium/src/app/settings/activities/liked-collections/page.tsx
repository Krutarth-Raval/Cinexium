import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ClientBackButton } from '@/components/ui/ClientBackButton';
import { LikedCollectionsGrid } from '@/components/activities/LikedCollectionsGrid';

export default async function LikedCollectionsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) redirect('/login');

  const likedCollections = await prisma.collectionLike.findMany({
    where: { userId: user.id },
    include: {
      collection: {
        include: {
          user: { select: { username: true, avatar: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="min-h-screen pt-4 md:pt-24 pb-24 px-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <ClientBackButton />
        <h1 className="text-xl md:text-3xl font-bold text-white">Liked Collections</h1>
      </div>
      <LikedCollectionsGrid initialData={likedCollections} />
    </div>
  );
}
