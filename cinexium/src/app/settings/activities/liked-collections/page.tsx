import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ClientBackButton } from '@/components/ui/ClientBackButton';

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

      <div className="space-y-4">
        {likedCollections.length === 0 ? (
          <div className="text-center py-12 bg-[#1a1d24] rounded-2xl border border-white/5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-500 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
            <h3 className="text-lg font-medium text-white mb-2">No liked collections</h3>
            <p className="text-gray-400">Collections you like will appear here.</p>
          </div>
        ) : (
          likedCollections.map((item) => (
            <Link key={item.id} href={`/collection/${item.collection.id}`} className="flex items-center gap-4 p-4 bg-[#1a1d24] rounded-2xl border border-white/5 hover:border-primary-500/50 transition-colors group">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                {item.collection.thumbnail ? (
                  <img src={item.collection.thumbnail} alt={item.collection.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-gray-600">
                      <path d="M19.5 22.5h-15A2.25 2.25 0 0 1 2.25 20.25V6A2.25 2.25 0 0 1 4.5 3.75h15A2.25 2.25 0 0 1 21.75 6v14.25a2.25 2.25 0 0 1-2.25 2.25ZM6.75 12a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm-2.25 5.25v1.5a.75.75 0 0 0 .75.75h13.5a.75.75 0 0 0 .75-.75v-3.75a3 3 0 0 0-3-3h-1.5a.75.75 0 0 0-.75.75v1.5a3 3 0 0 1-3 3H5.25a.75.75 0 0 1-.75-.75Z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate group-hover:text-primary-400 transition-colors">{item.collection.name}</h3>
                <p className="text-sm text-gray-400 truncate">By @{item.collection.user.username}</p>
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
