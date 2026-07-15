"use client";

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLongPress } from '@/hooks/useLongPress';
import { CustomSelect } from '@/components/ui/CustomSelect';

type CommentActivityItem = {
  id: string;
  mediaId: string;
  mediaType: string;
  content: string;
  createdAt: Date | string;
  likeCount: number;
  mediaTitle: string;
  username: string;
  avatar: string | null;
};

interface CommentActivityListProps {
  emptyDescription: string;
  initialData: CommentActivityItem[];
  mode: 'liked' | 'own';
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function formatRelativeTime(value: Date | string) {
  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (Math.abs(diffMinutes) < 60) {
    return relativeTimeFormatter.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return relativeTimeFormatter.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) {
    return relativeTimeFormatter.format(diffDays, 'day');
  }

  const diffWeeks = Math.round(diffDays / 7);
  if (Math.abs(diffWeeks) < 5) {
    return relativeTimeFormatter.format(diffWeeks, 'week');
  }

  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) {
    return relativeTimeFormatter.format(diffMonths, 'month');
  }

  const diffYears = Math.round(diffDays / 365);
  return relativeTimeFormatter.format(diffYears, 'year');
}

export function CommentActivityList({ emptyDescription, initialData, mode }: CommentActivityListProps) {
  const [items, setItems] = useState<CommentActivityItem[]>(initialData);
  const [sort, setSort] = useState('new');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sort === 'old' ? dateA - dateB : dateB - dateA;
    });
  }, [items, sort]);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
    if (next.size === 0) setSelectMode(false);
  };

  const handleBatchAction = async () => {
    if (selectedIds.size === 0) return;
    setIsProcessing(true);

    const previousItems = items;
    const selectedItems = items.filter((item) => selectedIds.has(item.id));

    try {
      setItems((prev) => prev.filter((item) => !selectedIds.has(item.id)));

      await Promise.all(
        selectedItems.map(async (item) => {
          if (mode === 'liked') {
            const response = await fetch(`/api/media/${item.mediaId}/comments/${item.id}/like`, {
              method: 'POST',
            });
            if (!response.ok) throw new Error('Failed to remove liked comment');
            return;
          }

          const response = await fetch(`/api/media/${item.mediaId}/comments/${item.id}`, {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error('Failed to delete comment');
        })
      );

      setSelectMode(false);
      setSelectedIds(new Set());
      router.refresh();
    } catch (error) {
      console.error(`Failed to ${mode === 'liked' ? 'remove liked comments' : 'delete comments'}`, error);
      setItems(previousItems);
      router.refresh();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative min-h-[50vh]">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-400">Sort by</span>
          <CustomSelect
            value={sort}
            onChange={setSort}
            options={[
              { value: 'new', label: 'Newest First' },
              { value: 'old', label: 'Oldest First' },
            ]}
          />
        </div>

        {items.length > 0 && (
          <button
            onClick={() => {
              setSelectMode(!selectMode);
              if (selectMode) setSelectedIds(new Set());
            }}
            className={`hidden items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors md:flex ${
              selectMode ? 'bg-primary-500 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            {selectMode ? 'Cancel' : 'Select'}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {sortedItems.map((item) => (
          <CommentActivityCard
            key={item.id}
            item={item}
            isSelectMode={selectMode}
            isSelected={selectedIds.has(item.id)}
            onToggle={() => toggleSelection(item.id)}
            onLongPress={() => {
              if (!selectMode) {
                setSelectMode(true);
                setSelectedIds(new Set([item.id]));
              }
            }}
          />
        ))}
      </div>

      {sortedItems.length === 0 && (
        <div className="mt-8 rounded-2xl border border-white/5 bg-[#1a1d24] py-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto mb-4 h-12 w-12 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
          <h3 className="mb-2 text-lg font-medium text-white">{mode === 'liked' ? 'No liked comments' : 'No comments yet'}</h3>
          <p className="text-gray-400">{emptyDescription}</p>
        </div>
      )}

      <AnimatePresence>
        {selectMode && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-1/2 z-50 flex w-[90%] -translate-x-1/2 items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#1a1d24]/95 px-4 py-3 shadow-2xl backdrop-blur-xl sm:w-auto sm:justify-start sm:gap-6 sm:px-6 sm:py-4 md:bottom-6"
          >
            <span className="whitespace-nowrap text-sm font-medium text-white sm:text-base">
              {selectedIds.size} selected
            </span>
            <div className="flex gap-1.5 sm:gap-2">
              <button
                onClick={() => {
                  setSelectMode(false);
                  setSelectedIds(new Set());
                }}
                className="flex items-center justify-center rounded-xl p-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 sm:px-4 sm:py-2"
                title="Cancel"
              >
                <span className="hidden sm:inline">Cancel</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 sm:hidden">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                onClick={handleBatchAction}
                disabled={selectedIds.size === 0 || isProcessing}
                className="flex items-center justify-center rounded-xl bg-red-500/20 p-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-50 sm:px-4 sm:py-2"
                title={mode === 'liked' ? 'Remove' : 'Delete'}
              >
                <span className="hidden sm:inline">{isProcessing ? '...' : mode === 'liked' ? 'Remove' : 'Delete'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 sm:hidden">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CommentActivityCard({ item, isSelectMode, isSelected, onToggle, onLongPress }: any) {
  const router = useRouter();
  const mediaPath = item.mediaType === 'tv' ? 'series' : item.mediaType;

  const handlers = useLongPress(
    () => onLongPress(),
    () => {
      if (isSelectMode) {
        onToggle();
        return;
      }
      router.push(`/${mediaPath}/${item.mediaId}`);
    },
    { delay: 500, shouldPreventDefault: false }
  );

  return (
    <div
      {...handlers}
      className={`group relative block cursor-pointer rounded-2xl border bg-[#1a1d24] p-4 transition-colors select-none ${
        isSelected ? 'border-primary-500/50 bg-primary-500/5' : 'border-white/5 hover:border-primary-500/40'
      }`}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="h-10 w-10 overflow-hidden rounded-full bg-white/10">
          {item.avatar ? (
            <img src={item.avatar} alt={item.username} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary-500 text-sm font-bold text-white">
              {item.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">@{item.username}</p>
          <p className="truncate text-xs text-gray-400">
            on <span className="text-primary-400">{item.mediaTitle}</span>
          </p>
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (isSelectMode) {
              onToggle();
            } else {
              onLongPress();
            }
          }}
          className={`flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] transition-all ${
            isSelectMode
              ? isSelected
                ? 'border-primary-500 bg-primary-500'
                : 'border-white/50 bg-black/20'
              : 'border-white/30 bg-black/20 opacity-0 md:group-hover:opacity-100'
          }`}
        >
          {isSelected && (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white" className="h-3.5 w-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
        </div>
      </div>

      <p className="mb-3 line-clamp-1 text-sm leading-6 text-gray-300">{item.content}</p>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{formatRelativeTime(item.createdAt)}</span>
        <span>{item.likeCount} like{item.likeCount === 1 ? '' : 's'}</span>
      </div>
    </div>
  );
}
