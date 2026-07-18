import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Link from 'next/link';
import { FollowButton } from '@/components/profile/FollowButton';
import { ProfileOptions } from '@/components/profile/ProfileOptions';
import { CreateCollectionModal } from '@/components/profile/CreateCollectionModal';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { FollowsModal } from '@/components/profile/FollowsModal';
import { Suspense } from 'react';
import { UsernameDisplay } from '@/components/profile/UsernameDisplay';
import { OwnProfileActionsDrawer } from '@/components/profile/OwnProfileActionsDrawer';

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const session = await getServerSession(authOptions);
  
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      collections: {
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { items: true } }
        }
      },
      collectionSaves: {
        orderBy: { createdAt: 'desc' },
        include: {
          collection: {
            include: {
              _count: { select: { items: true } }
            }
          }
        }
      },
      _count: {
        select: { 
          followers: { where: { status: 'ACCEPTED' } }, 
          following: { where: { status: 'ACCEPTED' } }
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
        followStatus = followRecord.status as 'ACCEPTED' | 'PENDING';
      }
    }
  }

  if (hasBlockedMe) {
    notFound(); // Hide profile completely if they blocked us
  }

  const canViewPrivateContent = isOwnProfile || followStatus === 'ACCEPTED';
  const canViewProtectedSections = !user.isPrivate || canViewPrivateContent;

  const visibleCollections = canViewProtectedSections
    ? user.collections.filter(c => c.isPublic || canViewPrivateContent)
    : [];
  const visibleSavedCollections = canViewProtectedSections
    ? user.collectionSaves
        .map(s => s.collection)
        .filter(c => c.isPublic || canViewPrivateContent)
    : [];

  const desktopFollowersStat = canViewProtectedSections ? (
    <Link href="?follows=followers" className="text-left hover:opacity-80 transition-opacity">
      <span className="font-bold text-white block text-lg">{user._count.followers}</span>
      <span className="text-gray-400 text-sm">followers</span>
    </Link>
  ) : (
    <div className="text-left opacity-70 cursor-not-allowed">
      <span className="font-bold text-white block text-lg">{user._count.followers}</span>
      <span className="text-gray-400 text-sm">followers</span>
    </div>
  );

  const desktopFollowingStat = canViewProtectedSections ? (
    <Link href="?follows=following" className="text-left hover:opacity-80 transition-opacity">
      <span className="font-bold text-white block text-lg">{user._count.following}</span>
      <span className="text-gray-400 text-sm">following</span>
    </Link>
  ) : (
    <div className="text-left opacity-70 cursor-not-allowed">
      <span className="font-bold text-white block text-lg">{user._count.following}</span>
      <span className="text-gray-400 text-sm">following</span>
    </div>
  );

  return (
    <div className="min-h-screen pt-4 md:pt-24 pb-24 px-4 max-w-4xl mx-auto">
      {/* Mobile Top Navigation */}
      <div className="flex md:hidden items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Link href="/" className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-lg font-bold text-white m-0 p-0 flex">
            <UsernameDisplay 
              username={user.username} 
              isPremium={user.isPremium} 
              isPrivate={user.isPrivate}
              showPrivacyIcon={true}
              iconSize="w-4 h-4"
            />
          </h1>
        </div>
        {isOwnProfile ? (
          <div className="-mr-2">
            <OwnProfileActionsDrawer user={{ id: user.id, username: user.username, name: user.name, avatar: user.avatar, isPremium: user.isPremium }} />
          </div>
        ) : (
          <div className="flex items-center -mr-2">
            <ProfileOptions user={{ id: user.id, username: user.username, name: user.name, avatar: user.avatar }} isBlocked={isBlocked} />
          </div>
        )}
      </div>

      {/* Profile Header */}
      <div className="mb-8 md:mb-12 relative">
        {/* Desktop Settings Icon or Options Icon */}
        {isOwnProfile ? (
          <div className="hidden md:block absolute top-0 right-0">
            <OwnProfileActionsDrawer user={{ id: user.id, username: user.username, name: user.name, avatar: user.avatar, isPremium: user.isPremium }} />
          </div>
        ) : (
          <div className="hidden md:block absolute top-0 right-0">
            <ProfileOptions user={{ id: user.id, username: user.username, name: user.name, avatar: user.avatar }} isBlocked={isBlocked} />
          </div>
        )}
        <div className="flex flex-col md:grid md:grid-cols-[auto_1fr] md:gap-x-8 md:gap-y-4">
          
          {/* Top section: Avatar + Stats (Mobile) / Avatar only (Desktop) */}
          <div className="flex items-center gap-6 md:block md:w-auto px-2 md:px-0 mt-2 md:mt-0">
            {/* Avatar */}
            <div className="w-20 h-20 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg border border-white/10 md:border-2 md:mb-0">
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-3xl md:text-5xl">{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            
            {/* Stats (Mobile only) */}
            <div className="flex-1 flex flex-col justify-center px-4 md:hidden">
              <div className="flex justify-between items-center w-full">
                <div className="text-center">
                  <span className="font-bold text-white block text-lg leading-tight">{visibleCollections.length}</span>
                  <span className="text-gray-400 text-xs">collections</span>
                </div>
                {canViewProtectedSections ? (
                  <>
                    <Link href="?follows=followers" className="text-center hover:opacity-80 transition-opacity">
                      <span className="font-bold text-white block text-lg leading-tight">{user._count.followers}</span>
                      <span className="text-gray-400 text-xs">followers</span>
                    </Link>
                    <Link href="?follows=following" className="text-center hover:opacity-80 transition-opacity">
                      <span className="font-bold text-white block text-lg leading-tight">{user._count.following}</span>
                      <span className="text-gray-400 text-xs">following</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="text-center opacity-70 cursor-not-allowed">
                      <span className="font-bold text-white block text-lg leading-tight">{user._count.followers}</span>
                      <span className="text-gray-400 text-xs">followers</span>
                    </div>
                    <div className="text-center opacity-70 cursor-not-allowed">
                      <span className="font-bold text-white block text-lg leading-tight">{user._count.following}</span>
                      <span className="text-gray-400 text-xs">following</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Desktop Right Side - Top: Username & Stats */}
          <div className="hidden md:flex flex-col self-center w-full">
            {/* Desktop Header */}
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-2xl font-bold text-white m-0 p-0 flex">
                <UsernameDisplay 
                  username={user.username} 
                  isPremium={user.isPremium} 
                  isPrivate={user.isPrivate}
                  showPrivacyIcon={true}
                  iconSize="w-5 h-5"
                />
              </h1>
            </div>
            
            {/* Stats (Desktop only) */}
            <div className="flex justify-start gap-8">
              <div className="text-left">
                <span className="font-bold text-white block text-lg">{visibleCollections.length}</span>
                <span className="text-gray-400 text-sm">collections</span>
              </div>
              {desktopFollowersStat}
              {desktopFollowingStat}
            </div>
          </div>
          
          {/* Bottom Section: Bio & Buttons */}
          <div className="md:col-start-1 md:col-span-2 text-left px-2 md:px-0 w-full mt-4 md:mt-0">
            {/* Bio (Both) */}
            <div className="mb-6">
              <h2 className="font-bold text-white text-xl mb-1">{user.name}</h2>
              <p className="text-gray-300 text-base whitespace-pre-wrap">{user.bio || 'No bio yet.'}</p>
            </div>

            {/* Action Buttons (Both) */}
            <div className="flex justify-start w-full">
              {isOwnProfile ? (
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Link href="/settings/profile" className="flex-1 md:flex-none text-center px-6 py-1.5 bg-[#252a34] hover:bg-[#323844] text-white font-semibold rounded-lg transition-colors text-sm border border-white/10">
                    Edit Profile
                  </Link>
                  <CreateCollectionModal />
                </div>
              ) : (
                <div className="flex flex-row items-center gap-2 w-full md:w-auto">
                  {!isBlocked && (
                    <div className="flex-1 sm:flex-none w-full *:w-full *:justify-center">
                      <FollowButton 
                        username={user.username} 
                        initialStatus={followStatus} 
                        isPrivate={user.isPrivate} 
                      />
                    </div>
                  )}
                  {followStatus === 'ACCEPTED' && !isBlocked && (
                    <Link href={`/chat/${user.username}`} className="flex-1 sm:flex-none text-center px-6 py-1.5 bg-[#252a34] hover:bg-[#323844] text-white font-semibold rounded-lg transition-colors text-sm border border-white/10">
                      Message
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Profile Tabs & Collection Grid */}
      {canViewProtectedSections ? (
        <ProfileTabs
          myCollections={visibleCollections}
          savedCollections={visibleSavedCollections}
          isOwner={isOwnProfile}
          canPin={isOwnProfile && user.isPremium}
        />
      ) : (
        <div className="mt-10 rounded-[28px] border border-white/10 bg-[#1a1d24]/80 px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16.5 10.5V7.875a4.5 4.5 0 10-9 0V10.5m-.75 0h10.5A2.25 2.25 0 0119.5 12.75v5.25a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 18v-5.25A2.25 2.25 0 016.75 10.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Private profile</h2>
          <p className="mt-2 text-sm text-gray-400">Follow to see collections and saved content.</p>
        </div>
      )}
      <Suspense fallback={null}>
        <FollowsModal
          username={user.username}
          isOwnProfile={isOwnProfile}
          canViewFollows={canViewProtectedSections}
        />
      </Suspense>
    </div>
  );
}
