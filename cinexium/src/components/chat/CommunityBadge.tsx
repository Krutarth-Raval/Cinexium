import React from 'react';

type CommunityBadgeProps = {
  className?: string;
  iconSize?: string;
};

export const CommunityBadge = ({
  className = '',
  iconSize = 'w-4 h-4',
}: CommunityBadgeProps) => {
  return (
    <svg 
      className={`text-purple-500 flex-shrink-0 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] ${iconSize} ${className}`} 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      title="Premium Community"
    >
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
    </svg>
  );
};
