'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FollowButton } from './FollowButton';
import { useRouter, useSearchParams } from 'next/navigation';
import ConfirmModal from '@/components/ui/ConfirmModal';

type UserData = {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  isPrivate: boolean;
  followStatus: 'NONE' | 'ACCEPTED' | 'PENDING';
  isMe: boolean;
};

type FollowsModalProps = {
  username: string;
  isOwnProfile: boolean;
  canViewFollows: boolean;
};

export const FollowsModal = ({ username, isOwnProfile, canViewFollows }: FollowsModalProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const followsParam = searchParams.get('follows');
  const isOpen = followsParam === 'followers' || followsParam === 'following';
  const initialTab = (followsParam as 'followers' | 'following') || 'followers';

  const [manualTab, setManualTab] = useState<'followers' | 'following' | null>(null);
  const [followers, setFollowers] = useState<UserData[]>([]);
  const [following, setFollowing] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<null | {
    type: 'remove-follower' | 'unfollow' | 'block';
    user: UserData;
  }>(null);
  const [processingUser, setProcessingUser] = useState<string | null>(null);

  const onClose = () => {
    setManualTab(null);
    setOpenMenuFor(null);
    setConfirmAction(null);
    router.push(`/profile/${username}`);
  };

  const activeTab = manualTab ?? initialTab;

  useEffect(() => {
    if (isOpen && canViewFollows) {
      const loadFollows = async () => {
        setLoading(true);
        setError(null);

        try {
          const res = await fetch(`/api/users/${username}/follows`);
          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || 'Failed to load follows.');
          }

          setFollowers(data.followers || []);
          setFollowing(data.following || []);
        } catch (fetchError) {
          setFollowers([]);
          setFollowing([]);
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load follows.');
        } finally {
          setLoading(false);
        }
      };

      void loadFollows();
    }
  }, [canViewFollows, isOpen, username]);

  if (!isOpen) return null;

  const currentList = activeTab === 'followers' ? followers : following;

  const refreshCurrentPage = () => {
    router.refresh();
    fetch(`/api/users/${username}/follows`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load follows.');
        }
        return data;
      })
      .then((data) => {
        setFollowers(data.followers || []);
        setFollowing(data.following || []);
      })
      .catch((fetchError) => {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to refresh follows.');
      });
  };

  const handleAction = async () => {
    if (!confirmAction) return;

    const { type, user } = confirmAction;
    const endpointMap = {
      unfollow: `/api/users/${user.username}/follow`,
      block: `/api/users/${user.username}/block`,
      'remove-follower': `/api/users/${user.username}/remove-follower`,
    } as const;

    setProcessingUser(user.id);

    try {
      const res = await fetch(endpointMap[type], { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Action failed.');
      }

      setOpenMenuFor(null);
      await refreshCurrentPage();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Action failed.');
    } finally {
      setProcessingUser(null);
      setConfirmAction(null);
    }
  };

  const renderTrailingActions = (user: UserData) => {
    if (user.isMe) return null;

    if (activeTab === 'followers') {
      return (
        <div className="flex items-center gap-2">
          <Link href={`/chat/${user.username}`} onClick={onClose} className="px-4 py-1.5 bg-[#252a34] hover:bg-[#323844] text-white font-medium rounded-lg transition-colors text-xs border border-white/10 inline-block">
            Message
          </Link>
          {isOwnProfile ? (
            <button
              type="button"
              onClick={() => setConfirmAction({ type: 'remove-follower', user })}
              disabled={processingUser === user.id}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
              title={`Remove @${user.username} from followers`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
      );
    }

    return (
      <div className="relative flex items-center gap-2">
        <Link href={`/chat/${user.username}`} onClick={onClose} className="px-4 py-1.5 bg-[#252a34] hover:bg-[#323844] text-white font-medium rounded-lg transition-colors text-xs border border-white/10 inline-block">
          Message
        </Link>
        <button
          type="button"
          onClick={() => setOpenMenuFor(openMenuFor === user.id ? null : user.id)}
          disabled={processingUser === user.id}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
          title={`More actions for @${user.username}`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6h.01M12 12h.01M12 18h.01" />
          </svg>
        </button>
        {openMenuFor === user.id ? (
          <div className="absolute right-0 top-11 z-20 min-w-[170px] rounded-2xl border border-white/10 bg-[#161a22] p-2 shadow-2xl">
            {(user.followStatus === 'ACCEPTED' || user.followStatus === 'PENDING') ? (
              <button
                type="button"
                onClick={() => setConfirmAction({ type: 'unfollow', user })}
                className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium text-white transition-colors hover:bg-white/5"
              >
                {user.followStatus === 'PENDING' ? 'Cancel request' : 'Unfollow'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setConfirmAction({ type: 'block', user })}
              className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
            >
              Block
            </button>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1115] lg:justify-end lg:bg-black/80 lg:p-4 lg:backdrop-blur-sm">
      <div className="bg-[#0f1115] w-full h-full overflow-hidden flex flex-col lg:h-[calc(100vh-2rem)] lg:w-[420px] lg:rounded-[32px] lg:border lg:border-white/10 lg:bg-[#1a1d24] lg:shadow-2xl">
        {/* Header & Tabs */}
        <div className="border-b border-white/10 pt-4">
          {/* Mobile Header */}
          <div className="flex lg:hidden items-center gap-2 px-4 mb-4">
            <button onClick={onClose} className="p-2 -ml-2 text-primary-500 hover:text-primary-400 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="text-lg font-bold text-white">@{username}</h1>
          </div>
          
          {/* Desktop Header */}
          <div className="hidden lg:flex justify-between items-center px-4 mb-2">
            <h2 className="text-xl font-bold text-white">Connections</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex">
            <button 
              className={`flex-1 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'followers' ? 'border-primary-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
              onClick={() => setManualTab('followers')}
            >
              Followers
            </button>
            <button 
              className={`flex-1 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'following' ? 'border-primary-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
              onClick={() => setManualTab('following')}
            >
              Following
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : !canViewFollows ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16.5 10.5V7.875a4.5 4.5 0 10-9 0V10.5m-.75 0h10.5A2.25 2.25 0 0119.5 12.75v5.25a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 18v-5.25A2.25 2.25 0 016.75 10.5z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-white">Private follow list</p>
              <p className="mt-2 text-sm text-gray-400">Follow this account to see followers and following.</p>
            </div>
          ) : error ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16.5 10.5V7.875a4.5 4.5 0 10-9 0V10.5m-.75 0h10.5A2.25 2.25 0 0119.5 12.75v5.25a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 18v-5.25A2.25 2.25 0 016.75 10.5z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-white">Private follow list</p>
              <p className="mt-2 text-sm text-gray-400">{error}</p>
            </div>
          ) : currentList.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No users found.
            </div>
          ) : (
            currentList.map(user => (
              <div key={user.id} className="flex items-center justify-between gap-3">
                <Link href={`/profile/${user.username}`} onClick={onClose} className="flex items-center gap-3 flex-1 min-w-0 group">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-lg">{user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-white font-bold text-sm truncate group-hover:underline">@{user.username}</span>
                    <span className="text-gray-400 text-xs truncate">{user.name || user.username}</span>
                  </div>
                </Link>
                
                <div className="flex-shrink-0 ml-2">
                  {activeTab === 'followers' && !isOwnProfile && !user.isMe ? (
                    user.followStatus === 'ACCEPTED' ? (
                      <Link href={`/chat/${user.username}`} onClick={onClose} className="px-4 py-1.5 bg-[#252a34] hover:bg-[#323844] text-white font-medium rounded-lg transition-colors text-xs border border-white/10 inline-block">
                        Message
                      </Link>
                    ) : (
                      <FollowButton
                        username={user.username}
                        initialStatus={user.followStatus}
                        isPrivate={user.isPrivate}
                      />
                    )
                  ) : (
                    renderTrailingActions(user)
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
    <ConfirmModal
      isOpen={Boolean(confirmAction)}
      onClose={() => setConfirmAction(null)}
      onConfirm={handleAction}
      title={
        confirmAction?.type === 'remove-follower'
          ? 'Remove follower'
          : confirmAction?.type === 'unfollow'
            ? 'Unfollow user'
            : 'Block user'
      }
      message={
        confirmAction?.type === 'remove-follower'
          ? `Are you sure you want to remove @${confirmAction.user.username} from your followers?`
          : confirmAction?.type === 'unfollow'
            ? `Are you sure you want to unfollow @${confirmAction.user.username}?`
            : `Are you sure you want to block @${confirmAction?.user.username}?`
      }
      confirmText={
        confirmAction?.type === 'remove-follower'
          ? 'Remove'
          : confirmAction?.type === 'unfollow'
            ? 'Unfollow'
            : 'Block'
      }
      isDestructive
    />
    </>
  );
};
