'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { GifPicker } from '@/components/gif/GifPicker';
import { SelectedGifPreview } from '@/components/gif/SelectedGifPreview';
import type { GifSelection } from '@/lib/giphy';

interface Comment {
  id: string;
  content: string;
  gifId?: string | null;
  gifUrl?: string | null;
  createdAt: string;
  parentId?: string | null;
  user: { id: string; name: string; username: string; avatar: string | null };
  _count: { likes: number; replies: number };
  likes: { userId: string }[];
  replies?: Comment[];
}

interface SessionUser {
  id?: string;
  username?: string;
  avatar?: string | null;
}

const formatCompactRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 52) return `${diffInWeeks}w`;
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y`;
};

const countComments = (list: Comment[]): number => {
  return list.reduce((total, comment) => total + 1 + countComments(comment.replies || []), 0);
};

export const MediaComments = ({
  mediaId,
  mediaType,
  onCommentsCountChange,
  onGifOpen,
}: {
  mediaId: string,
  mediaType: string,
  onCommentsCountChange?: (count: number) => void,
  onGifOpen?: () => void,
}) => {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedGif, setSelectedGif] = useState<GifSelection | null>(null);
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyingToUsername, setReplyingToUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [focusedCommentId, setFocusedCommentId] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentUser = (session?.user as SessionUser | undefined) ?? {};
  const currentUserId = currentUser.id ?? '';
  const canSubmitComment = Boolean(newComment.trim() || selectedGif) && !posting;

  useEffect(() => {
    onCommentsCountChange?.(countComments(comments));
  }, [comments, onCommentsCountChange]);

  const reloadComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/media/${mediaId}/comments`);
      if (res.ok) {
        const nextComments = await res.json();
        setComments(nextComments);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [mediaId, onCommentsCountChange]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void reloadComments();
    }, 0);

    return () => clearTimeout(timeout);
  }, [reloadComments]);

  const handlePostComment = async () => {
    const content = newComment;
    if ((!content.trim() && !selectedGif) || posting) return;
    
    const trimmedContent = content.trim();
    const finalContent = replyingToUsername && trimmedContent
      ? `@${replyingToUsername} ${trimmedContent}`
      : trimmedContent;
    const isReply = !!replyingTo;
    const targetParentId = replyingTo;
    const pendingGif = selectedGif;

    // Create optimistic comment
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      content: finalContent,
      gifId: pendingGif?.id ?? null,
      gifUrl: pendingGif?.url ?? null,
      createdAt: new Date().toISOString(),
      user: {
        id: currentUser.id || '',
        name: session?.user?.name || '',
        username: currentUser.username || '',
        avatar: session?.user?.image || currentUser.avatar || ''
      },
      _count: { likes: 0, replies: 0 },
      likes: [],
      replies: []
    };

    // Optimistic UI Update
    setComments(prev => {
      const nextComments = isReply
        ? prev.map(c => {
          if (c.id === targetParentId) {
            return {
              ...c,
              replies: [...(c.replies || []), optimisticComment]
            };
          }
          return c;
        })
        : [optimisticComment, ...prev];
      return nextComments;
    });

    setPosting(true);
    // Clear inputs immediately for better UX
    setNewComment('');
    setSelectedGif(null);
    setIsGifPickerOpen(false);
    setReplyingTo(null);
    setReplyingToUsername(null);

    try {
      await fetch(`/api/media/${mediaId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: finalContent, 
          gifId: pendingGif?.id ?? null,
          gifUrl: pendingGif?.url ?? null,
          mediaType, 
          parentId: targetParentId 
        })
      });
      
      // Fetch real data to replace temporary ID and sync
      reloadComments();
    } catch (e) {
      console.error(e);
      reloadComments(); // Revert on fail
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!session?.user) return;
    
    // Optimistic UI update
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        const isLiked = c.likes.some(l => l.userId === currentUserId);
        return {
          ...c,
          _count: { ...c._count, likes: c._count.likes + (isLiked ? -1 : 1) },
          likes: isLiked ? c.likes.filter(l => l.userId !== currentUserId) : [...c.likes, { userId: currentUserId }]
        };
      }
      if (c.replies) {
        return {
          ...c,
          replies: c.replies.map(r => {
            if (r.id === commentId) {
              const isLiked = r.likes.some(l => l.userId === currentUserId);
              return {
                ...r,
                _count: { ...r._count, likes: r._count.likes + (isLiked ? -1 : 1) },
                likes: isLiked ? r.likes.filter(l => l.userId !== currentUserId) : [...r.likes, { userId: currentUserId }]
              };
            }
            return r;
          })
        };
      }
      return c;
    }));

    try {
      await fetch(`/api/media/${mediaId}/comments/${commentId}/like`, { method: 'POST' });
    } catch (e) {
      console.error(e);
      reloadComments(); // Revert on failure
    }
  };

  const removeCommentById = (list: Comment[], targetId: string): Comment[] => {
    return list
      .filter((comment) => comment.id !== targetId)
      .map((comment) => ({
        ...comment,
        replies: comment.replies ? removeCommentById(comment.replies, targetId) : [],
      }));
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;

    const targetId = commentToDelete.id;
    const previousComments = comments;

    const nextComments = removeCommentById(comments, targetId);
    setComments(nextComments);
    if (focusedCommentId === targetId) {
      setFocusedCommentId(null);
    }

    try {
      const res = await fetch(`/api/media/${mediaId}/comments/${targetId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        setComments(previousComments);
        reloadComments();
      }
    } catch (e) {
      console.error(e);
      setComments(previousComments);
      reloadComments();
    } finally {
      setCommentToDelete(null);
    }
  };

  const startCommentFocus = (commentId: string) => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
    longPressTimeoutRef.current = setTimeout(() => {
      setFocusedCommentId(commentId);
      longPressTimeoutRef.current = null;
    }, 450);
  };

  const clearCommentFocusTimer = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isLiked = session?.user && comment.likes.some(l => l.userId === currentUserId);
    const isOwner = comment.user.id === currentUserId;
    const isFocused = focusedCommentId === comment.id;
    const mobileFocusedState = focusedCommentId !== null;
    const showDesktopDelete = isOwner;
    const showMobileDelete = isOwner && isFocused;
    
    return (
      <div key={comment.id} className={isReply ? 'mt-4' : ''}>
        <div
          className={`flex gap-3 rounded-2xl transition-all duration-200 ${
            mobileFocusedState
              ? isFocused
                ? 'md:bg-transparent bg-white/[0.03] md:ring-0 ring-1 ring-white/10 p-2'
                : 'md:blur-0 md:opacity-100 blur-[2px] opacity-35 scale-[0.985]'
              : ''
          }`}
          onClick={() => {
            if (focusedCommentId === comment.id) {
              setFocusedCommentId(null);
            }
          }}
          onTouchStart={() => startCommentFocus(comment.id)}
          onTouchEnd={clearCommentFocusTimer}
          onTouchCancel={clearCommentFocusTimer}
          onMouseDown={() => startCommentFocus(comment.id)}
          onMouseUp={clearCommentFocusTimer}
          onMouseLeave={clearCommentFocusTimer}
          onContextMenu={(e) => {
            e.preventDefault();
          }}
        >
          <Link href={`/profile/${comment.user.username}`} className="flex-shrink-0">
            {comment.user.avatar ? (
              <img src={comment.user.avatar} alt={comment.user.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-red-800 flex items-center justify-center text-white font-bold">
                {comment.user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start w-full">
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/profile/${comment.user.username}`} className="font-bold text-sm text-white hover:underline">
                    {comment.user.username}
                  </Link>
                  <span className="text-xs font-medium text-gray-500">
                    {formatCompactRelativeTime(comment.createdAt)}
                  </span>
                </div>
                {comment.content && (
                  <p className="text-gray-300 text-sm mb-2 whitespace-pre-wrap">{comment.content}</p>
                )}
                {comment.gifUrl && (
                  <div className="mb-2">
                    <img
                      src={comment.gifUrl}
                      alt="Comment GIF"
                      className="max-h-48 rounded-2xl border border-white/10 object-cover"
                    />
                  </div>
                )}
                
                <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const targetParentId = isReply ? (comment.parentId || comment.id) : comment.id;
                      if (replyingTo === targetParentId && replyingToUsername === comment.user.username) {
                        setReplyingTo(null);
                        setReplyingToUsername(null);
                      } else {
                        setReplyingTo(targetParentId);
                        setReplyingToUsername(comment.user.username);
                      }
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Reply
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 min-w-[2rem]">
                <div className="flex items-center gap-2">
                  {(showDesktopDelete || showMobileDelete) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCommentToDelete(comment);
                      }}
                      className={`${showMobileDelete ? 'md:hidden' : 'hidden md:inline-flex'} transition-transform active:scale-95 text-gray-500 hover:text-red-400`}
                      aria-label="Delete comment"
                      title="Delete comment"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(comment.id);
                    }}
                    className={`transition-transform active:scale-95 ${isLiked ? 'text-primary-500' : 'text-gray-500 hover:text-white'}`}
                  >
                    <svg className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isLiked ? 0 : 2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  </button>
                </div>
                {comment._count?.likes > 0 && (
                  <span className="text-[10px] text-gray-500 font-medium mt-0.5 pr-0.5">{comment._count.likes}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 pl-4 border-l-2 border-white/5 space-y-2">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full min-h-0">
      
      {/* Comments List */}
      <div
        className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setFocusedCommentId(null);
          }
        }}
      >
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map(c => renderComment(c))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={commentToDelete !== null}
        onClose={() => setCommentToDelete(null)}
        onConfirm={handleDeleteComment}
        title="Delete comment?"
        message="This will permanently remove your comment and its replies. This action cannot be undone."
        confirmText="Delete"
        isDestructive
      />

      {/* Post Comment Input (Sticky Bottom) */}
      <div className="shrink-0 bg-[#0f1115]/95 backdrop-blur-md border-t border-white/10 px-4 pt-4 pb-6 md:pb-5 flex flex-col gap-2">
        {replyingToUsername && (
          <div className="flex items-center justify-between w-full max-w-4xl mx-auto px-2">
            <span className="text-xs text-gray-400 font-medium">Replying to <span className="text-white">@{replyingToUsername}</span></span>
            <button 
              onClick={() => { setReplyingTo(null); setReplyingToUsername(null); }} 
              className="text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-1 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {selectedGif && (
          <div className="w-full max-w-4xl mx-auto">
            <SelectedGifPreview gif={selectedGif} onClear={() => setSelectedGif(null)} className="max-w-full sm:max-w-[14rem]" />
          </div>
        )}
        <div className="flex gap-3 max-w-4xl mx-auto items-center w-full">
          <div className="relative flex-1">
            <GifPicker
              isOpen={isGifPickerOpen}
              mode="popover"
              variant="comment"
              onClose={() => setIsGifPickerOpen(false)}
              onSelect={(gif) => setSelectedGif(gif)}
            />
            <div className="flex-1 flex items-center bg-[#1a1d24] border border-white/10 rounded-full px-5 pr-16 h-12 overflow-hidden focus-within:border-primary-500 transition-colors">
              {replyingToUsername && (
                <span className="text-primary-500 font-medium text-sm mr-2 whitespace-nowrap bg-primary-500/10 px-2 py-0.5 rounded cursor-default select-none flex items-center gap-1">
                  @{replyingToUsername}
                </span>
              )}
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="What are your thoughts?"
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none h-full w-full min-w-0"
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && newComment === '') {
                    setReplyingTo(null);
                    setReplyingToUsername(null);
                  }
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handlePostComment();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  onGifOpen?.();
                  setIsGifPickerOpen((prev) => !prev);
                }}
                className={`absolute inset-y-0 right-2 my-auto flex h-8 items-center justify-center rounded-full border px-1.5 transition-colors ${
                  isGifPickerOpen || selectedGif
                    ? 'border-primary-500/40 bg-primary-500/15 text-white'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-white'
                }`}
              >
                <span
                  className={`flex h-6 items-center rounded-[8px] px-2.5 text-[11px] font-black uppercase leading-none tracking-[0.18em] ${
                    isGifPickerOpen || selectedGif
                      ? 'bg-primary-500 text-white'
                      : 'bg-[#2b313d] text-white/95'
                  }`}
                >
                  GIF
                </span>
              </button>
            </div>
          </div>
          <button
            onClick={() => handlePostComment()}
            disabled={!canSubmitComment}
            className="w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center self-center shrink-0 disabled:opacity-50 hover:bg-primary-600 transition-colors shadow-lg"
          >
            <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>

    </div>
  );
};
