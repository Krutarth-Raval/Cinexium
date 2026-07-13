import React from 'react';

type UsernameDisplayProps = {
  username: string;
  isPremium?: boolean;
  isPrivate?: boolean;
  className?: string;
  iconSize?: string;
  showPrivacyIcon?: boolean;
};

export const UsernameDisplay = ({
  username,
  isPremium = false,
  isPrivate = false,
  className = '',
  iconSize = 'w-4 h-4',
  showPrivacyIcon = false,
}: UsernameDisplayProps) => {
  return (
    <div className={`flex items-center gap-1.5 min-w-0 ${className}`}>
      {showPrivacyIcon && (
        isPrivate ? (
          <svg className={`text-gray-400 flex-shrink-0 ${iconSize}`} viewBox="0 0 20 20" fill="currentColor" title="Private Account">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className={`text-gray-400 flex-shrink-0 ${iconSize}`} viewBox="0 0 20 20" fill="currentColor" title="Public Account">
            <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H9V7a1 1 0 012 0v2h2V7a3 3 0 00-3-3z" />
          </svg>
        )
      )}
      <span className="truncate min-w-0">@{username}</span>
      {isPremium && (
        <svg 
          className={`text-primary-500 ${iconSize} flex-shrink-0 drop-shadow-[0_0_8px_rgba(229,9,20,0.5)]`} 
          viewBox="0 0 24 24" 
          fill="currentColor"
          title="Premium User"
        >
          <path d="M12 1L9 9l-8 3 8 3 3 8 3-8 8-3-8-3-3-8z" />
        </svg>
      )}
    </div>
  );
};
