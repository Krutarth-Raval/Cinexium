'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; username: string; avatar: string };
  _count: { likes: number; replies: number };
  likes: { userId: string }[];
  replies?: Comment[];
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

export const MediaComments = ({ mediaId, mediaType }: { mediaId: string, mediaType: string }) => {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyingToUsername, setReplyingToUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [mediaId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/media/${mediaId}/comments`);
      if (res.ok) {
        setComments(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async () => {
    const content = newComment;
    if (!content.trim() || posting) return;
    
    const finalContent = replyingToUsername ? `@${replyingToUsername} ${content}` : content;
    const isReply = !!replyingTo;
    const targetParentId = replyingTo;

    // Create optimistic comment
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      content: finalContent,
      createdAt: new Date().toISOString(),
      user: {
        id: (session?.user as any)?.id || '',
        name: session?.user?.name || '',
        username: (session?.user as any)?.username || '',
        avatar: session?.user?.image || (session?.user as any)?.avatar || ''
      },
      _count: { likes: 0, replies: 0 },
      likes: [],
      replies: []
    };

    // Optimistic UI Update
    setComments(prev => {
      if (isReply) {
        return prev.map(c => {
          if (c.id === targetParentId) {
            return {
              ...c,
              replies: [...(c.replies || []), optimisticComment]
            };
          }
          return c;
        });
      }
      return [optimisticComment, ...prev];
    });

    setPosting(true);
    // Clear inputs immediately for better UX
    setNewComment('');
    setReplyingTo(null);
    setReplyingToUsername(null);

    try {
      const res = await fetch(`/api/media/${mediaId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: finalContent, 
          mediaType, 
          parentId: targetParentId 
        })
      });
      
      // Fetch real data to replace temporary ID and sync
      fetchComments();
    } catch (e) {
      console.error(e);
      fetchComments(); // Revert on fail
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!session?.user) return;
    
    // Optimistic UI update
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        const isLiked = c.likes.some(l => l.userId === (session.user as any).id);
        return {
          ...c,
          _count: { ...c._count, likes: c._count.likes + (isLiked ? -1 : 1) },
          likes: isLiked ? c.likes.filter(l => l.userId !== (session.user as any).id) : [...c.likes, { userId: (session.user as any).id }]
        };
      }
      if (c.replies) {
        return {
          ...c,
          replies: c.replies.map(r => {
            if (r.id === commentId) {
              const isLiked = r.likes.some(l => l.userId === (session.user as any).id);
              return {
                ...r,
                _count: { ...r._count, likes: r._count.likes + (isLiked ? -1 : 1) },
                likes: isLiked ? r.likes.filter(l => l.userId !== (session.user as any).id) : [...r.likes, { userId: (session.user as any).id }]
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
      fetchComments(); // Revert on failure
    }
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isLiked = session?.user && comment.likes.some(l => l.userId === (session.user as any).id);
    
    return (
      <div key={comment.id} className={`flex gap-3 ${isReply ? 'mt-4' : 'border-b border-white/5 pb-6'}`}>
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
              <p className="text-gray-300 text-sm mb-2 whitespace-pre-wrap">{comment.content}</p>
              
              <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                <button 
                  onClick={() => {
                    const targetParentId = isReply ? (comment as any).parentId : comment.id;
                    if (replyingTo === targetParentId && replyingToUsername === comment.user.username) {
                      setReplyingTo(null);
                      setReplyingToUsername(null);
                    } else {
                      setReplyingTo(targetParentId);
                      setReplyingToUsername(comment.user.username);
                      // Set focus to the main input (we can just let the user click it, or it will be obvious)
                    }
                  }}
                  className="hover:text-white transition-colors"
                >
                  Reply
                </button>
              </div>
            </div>

            {/* Like Button (Far Right) */}
            <div className="flex flex-col items-center shrink-0 w-8">
              <button 
                onClick={() => handleLike(comment.id)}
                className={`transition-transform active:scale-95 ${isLiked ? 'text-primary-500' : 'text-gray-500 hover:text-white'}`}
              >
                <svg className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isLiked ? 0 : 2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </button>
              {comment._count?.likes > 0 && (
                <span className="text-[10px] text-gray-500 font-medium mt-0.5">{comment._count.likes}</span>
              )}
            </div>
          </div>

          {/* Inline Reply Input Removed */}

          {/* Render Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 pl-4 border-l-2 border-white/5 space-y-2">
              {comment.replies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full relative min-h-0">
      
      {/* Comments List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 pb-32">
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

      {/* Post Comment Input (Sticky Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#0f1115]/95 backdrop-blur-md border-t border-white/10 p-4 pb-safe md:pb-4 flex flex-col gap-2">
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
        <div className="flex gap-3 max-w-4xl mx-auto items-center w-full">
          <div className="flex-1 flex items-center bg-[#1a1d24] border border-white/10 rounded-full px-5 h-12 overflow-hidden focus-within:border-primary-500 transition-colors">
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
          </div>
          <button
            onClick={() => handlePostComment()}
            disabled={!newComment.trim() || posting}
            className="w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center shrink-0 disabled:opacity-50 hover:bg-primary-600 transition-colors shadow-lg"
          >
            <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>

    </div>
  );
};
