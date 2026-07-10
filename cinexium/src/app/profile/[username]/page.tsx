import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Link from 'next/link';
import { tmdb } from '@/lib/tmdb';
import { FollowButton } from '@/components/profile/FollowButton';
import { BlockButton } from '@/components/profile/BlockButton';

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const session = await getServerSession(authOptions);
  
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      favorites: {
        orderBy: { addedAt: 'desc' }
      },
      _count: {
        select: { 
          followers: { where: { status: 'ACCEPTED' } }, 
          following: { where: { status: 'ACCEPTED' } }, 
          favorites: true 
        }
      }
    }
  });

  if (!user) {
    notFound();
  }

  const isOwnProfile = session?.user?.email === user.email;

  let followStatus: 'NONE' | 'ACCEPTED' | 'PENDING' = 'NONE';
  let isBlocked = false;
  let hasBlockedMe = false;
  
  if (session?.user?.email && !isOwnProfile) {
    const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (currentUser) {
      // Check block
      const blockRecord = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: currentUser.id, blockedId: user.id },
            { blockerId: user.id, blockedId: currentUser.id }
          ]
        }
      });
      if (blockRecord) {
        if (blockRecord.blockerId === currentUser.id) isBlocked = true;
        if (blockRecord.blockerId === user.id) hasBlockedMe = true;
      }

      const followRecord = await prisma.follows.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: user.id
          }
        }
      });
      if (followRecord) {
        followStatus = (followRecord as any).status as 'ACCEPTED' | 'PENDING';
      }
    }
  }

  if (hasBlockedMe) {
    notFound(); // Hide profile completely if they blocked us
  }

  // Fetch TMDB data for favorites
  const collectionPromises = user.favorites.map(fav => 
    tmdb.getMediaDetails(fav.mediaType as 'movie' | 'tv', fav.mediaId)
  );
  
  const collectionItems = (await Promise.all(collectionPromises)).filter(Boolean);

  return (
    <div className="min-h-screen pt-24 pb-24 px-4 max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="mb-8 md:mb-12">
        {/* Mobile Username Header (hidden on md) */}
        <div className="md:hidden flex items-center mb-6 px-2">
          <h1 className="text-xl font-bold text-white">{user.username}</h1>
        </div>

        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
          
          {/* Top section: Avatar + Stats (Mobile) / Avatar only (Desktop) */}
          <div className="flex items-center gap-6 md:block md:w-auto px-2 md:px-0">
            {/* Avatar */}
            <div className="w-20 h-20 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-primary-500 to-red-800 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg border border-white/10 md:border-2 md:mb-0">
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-3xl md:text-5xl">{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            
            {/* Stats (Mobile only) */}
            <div className="flex-1 flex justify-between items-center px-4 md:hidden">
              <div className="text-center">
                <span className="font-bold text-white block text-lg leading-tight">{user._count.favorites}</span>
                <span className="text-gray-400 text-xs">posts</span>
              </div>
              <div className="text-center">
                <span className="font-bold text-white block text-lg leading-tight">{user._count.followers}</span>
                <span className="text-gray-400 text-xs">followers</span>
              </div>
              <div className="text-center">
                <span className="font-bold text-white block text-lg leading-tight">{user._count.following}</span>
                <span className="text-gray-400 text-xs">following</span>
              </div>
            </div>
          </div>
          
          {/* Desktop Right Side / Mobile Bottom Side */}
          <div className="flex-1 text-left px-2 md:px-0 w-full">
            {/* Desktop Header */}
            <div className="hidden md:flex items-center gap-4 mb-6">
              <h1 className="text-2xl font-bold text-white">{user.username}</h1>
            </div>
            
            {/* Stats (Desktop only) */}
            <div className="hidden md:flex justify-start gap-8 mb-6">
              <div className="text-left">
                <span className="font-bold text-white block text-lg">{user._count.favorites}</span>
                <span className="text-gray-400 text-sm">posts</span>
              </div>
              <div className="text-left">
                <span className="font-bold text-white block text-lg">{user._count.followers}</span>
                <span className="text-gray-400 text-sm">followers</span>
              </div>
              <div className="text-left">
                <span className="font-bold text-white block text-lg">{user._count.following}</span>
                <span className="text-gray-400 text-sm">following</span>
              </div>
            </div>
            
            {/* Bio (Both) */}
            <div className="mb-6">
              <h2 className="font-bold text-white text-sm mb-1">{user.name}</h2>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{user.bio || 'No bio yet.'}</p>
            </div>

            {/* Action Buttons (Both) */}
            <div className="flex justify-start w-full">
              {isOwnProfile ? (
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Link href="/settings" className="flex-1 md:flex-none text-center px-6 py-1.5 bg-[#252a34] hover:bg-[#323844] text-white font-semibold rounded-lg transition-colors text-sm border border-white/10">
                    Edit Profile
                  </Link>
                  <Link href="#" className="flex-1 md:flex-none text-center px-6 py-1.5 bg-[#252a34] hover:bg-[#323844] text-white font-semibold rounded-lg transition-colors text-sm border border-white/10">
                    View archive
                  </Link>
                </div>
              ) : (
                <div className="flex flex-row items-center gap-2 w-full md:w-auto">
                  <div className="flex-1 sm:flex-none w-full *:w-full *:justify-center">
                    <FollowButton 
                      username={user.username} 
                      initialStatus={followStatus} 
                      isPrivate={user.isPrivate} 
                    />
                  </div>
                  {followStatus === 'ACCEPTED' && !isBlocked && (
                    <Link href={`/chat/${user.username}`} className="flex-1 sm:flex-none text-center px-6 py-1.5 bg-[#252a34] hover:bg-[#323844] text-white font-semibold rounded-lg transition-colors text-sm border border-white/10">
                      Message
                    </Link>
                  )}
                  <div className="sm:flex-none flex justify-center">
                    <BlockButton username={user.username} initiallyBlocked={isBlocked} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Divider */}
      <div className="border-t border-white/10 mb-8">
        <div className="flex justify-center">
          <div className="px-6 py-4 border-t-2 border-white text-white font-medium text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            COLLECTION
          </div>
        </div>
      </div>
      
      {/* Collection Grid */}
      {collectionItems.length > 0 ? (
        <div className="grid grid-cols-3 gap-1 md:gap-4">
          {collectionItems.map((item: any) => (
            <Link href={`/${item.type}/${item.id}`} key={`${item.type}-${item.id}`} className="group relative aspect-square overflow-hidden bg-[#1a1d24]">
              <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
                <span className="text-white font-bold text-center text-xs md:text-base line-clamp-2">{item.title}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-12">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          <p>No items in collection yet.</p>
        </div>
      )}
    </div>
  );
}
