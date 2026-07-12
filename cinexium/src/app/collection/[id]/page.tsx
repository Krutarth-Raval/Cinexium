import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Link from 'next/link';
import { tmdb } from '@/lib/tmdb';
import { CollectionActions } from './CollectionActions';
import { CollectionMobileHeader } from '@/components/collection/CollectionMobileHeader';
import { CollectionItemsGrid } from '@/components/collection/CollectionItemsGrid';

function formatTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo";
  interval = seconds / 86400;
  if (interval >= 7) return Math.floor(interval / 7) + "w";
  if (interval >= 1) return Math.floor(interval) + "d";
  interval = seconds / 3600;
  if (interval >= 1) return Math.floor(interval) + "h";
  interval = seconds / 60;
  if (interval >= 1) return Math.floor(interval) + "m";
  return Math.floor(seconds) + "s";
}

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      user: true,
      items: {
        orderBy: { addedAt: 'desc' }
      },
      _count: {
        select: { likes: true, saves: true, items: true }
      }
    }
  });

  if (!collection) {
    notFound();
  }

  let currentUser = null;
  if (session?.user?.email) {
    currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        collectionLikes: { where: { collectionId: id } },
        collectionSaves: { where: { collectionId: id } }
      }
    });
  }

  const isOwner = currentUser?.id === collection.userId;

  if (!collection.isPublic && !isOwner) {
    notFound();
  }

  // Fetch TMDB data for items
  const itemPromises = collection.items.map(async item => {
    const details = await tmdb.getMediaDetails(item.mediaType as 'movie' | 'tv', item.mediaId);
    if (!details) return null;
    return {
      ...details,
      addedAt: item.addedAt,
      collectionItemId: item.id,
      pinnedAt: item.pinnedAt
    };
  });
  
  const mediaItems = (await Promise.all(itemPromises)).filter(Boolean);

  const isLiked = currentUser ? currentUser.collectionLikes.length > 0 : false;
  const isSaved = currentUser ? currentUser.collectionSaves.length > 0 : false;

  return (
    <div className="min-h-screen pt-4 md:pt-24 pb-24 px-4 max-w-5xl mx-auto">
      {/* ===== Mobile Header ===== */}
      <div className="md:hidden mb-8">
        {/* Centered Thumbnail (shrinks on scroll) */}
        <CollectionMobileHeader thumbnail={collection.thumbnail} name={collection.name} />

        {/* Title centered */}
        <div className="text-center mt-4">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold text-white">{collection.name}</h1>
            {!collection.isPublic && (
              <span className="px-2 py-0.5 bg-white/10 text-white text-xs font-semibold rounded-md">Private</span>
            )}
          </div>

          {collection.description && (
            <p className="text-gray-400 text-sm mt-2 whitespace-pre-wrap">{collection.description}</p>
          )}
        </div>

        {/* Stats row — left aligned */}
        <div className="flex items-center gap-5 mt-4 text-sm">
          <span className="text-gray-400">{collection._count.items} items</span>
          {isOwner && (
            <>
              <span className="flex items-center gap-1 text-gray-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                {collection._count.likes}
              </span>
              <span className="flex items-center gap-1 text-gray-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                {collection._count.saves}
              </span>
            </>
          )}
        </div>

        {/* Owner — left aligned */}
        <Link href={`/profile/${collection.user.username}`} className="flex items-center gap-2 mt-3 hover:opacity-80 transition-opacity w-max">
          <div className="w-7 h-7 rounded-full bg-primary-500 overflow-hidden flex items-center justify-center">
            {collection.user.avatar ? (
              <img src={collection.user.avatar} alt={collection.user.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-xs font-bold">{collection.user.name.charAt(0)}</span>
            )}
          </div>
          <span className="text-white text-sm font-medium">@{collection.user.username}</span>
        </Link>

        {/* Actions */}
        <div className="mt-5">
          <CollectionActions 
            collectionId={collection.id}
            initialLiked={isLiked}
            initialSaved={isSaved}
            initialLikeCount={collection._count.likes}
            initialSaveCount={collection._count.saves}
            isOwner={isOwner}
            isMobile={true}
            collectionDetails={{
              name: collection.name,
              description: collection.description || '',
              isPublic: collection.isPublic,
              thumbnail: collection.thumbnail,
              itemCount: collection._count.items,
              creatorUsername: collection.user.username
            }}
          />
        </div>
      </div>

      {/* ===== Desktop Header ===== */}
      <div className="hidden md:block mb-10">
        <div className="flex flex-row gap-10 items-start">
          {/* Thumbnail */}
          <div className="w-48 h-48 rounded-2xl overflow-hidden bg-[#1a1d24] border border-white/10 flex-shrink-0 shadow-2xl">
            {collection.thumbnail ? (
              <img src={collection.thumbnail} alt={collection.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#252a34] to-[#1a1d24]">
                <svg className="w-16 h-16 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122" />
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-white">{collection.name}</h1>
              {!collection.isPublic && (
                <span className="px-2 py-1 bg-white/10 text-white text-xs font-semibold rounded-md">Private</span>
              )}
            </div>
            <p className="text-gray-400 mb-4">{collection._count.items} items</p>
            <Link href={`/profile/${collection.user.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity w-max mb-6">
              <div className="w-8 h-8 rounded-full bg-primary-500 overflow-hidden flex items-center justify-center">
                {collection.user.avatar ? (
                  <img src={collection.user.avatar} alt={collection.user.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xs font-bold">{collection.user.name.charAt(0)}</span>
                )}
              </div>
              <span className="text-white font-medium hover:underline">@{collection.user.username}</span>
            </Link>

            {collection.description && (
              <p className="text-gray-300 whitespace-pre-wrap max-w-3xl mb-2">{collection.description}</p>
            )}

            <CollectionActions 
              collectionId={collection.id}
              initialLiked={isLiked}
              initialSaved={isSaved}
              initialLikeCount={collection._count.likes}
              initialSaveCount={collection._count.saves}
              isOwner={isOwner}
              collectionDetails={{
                name: collection.name,
                description: collection.description || '',
                isPublic: collection.isPublic,
                thumbnail: collection.thumbnail,
                itemCount: collection._count.items,
                creatorUsername: collection.user.username
              }}
            />
          </div>
        </div>
      </div>

      <div className="w-full h-[1px] bg-white/10 mb-8" />

      {/* Grid */}
      {mediaItems.length > 0 ? (
        <CollectionItemsGrid 
          initialItems={mediaItems} 
          collectionId={collection.id} 
          isOwner={isOwner} 
        />
      ) : (
        <div className="text-center text-gray-500 mt-20">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <p>This collection is empty.</p>
        </div>
      )}
    </div>
  );
}
