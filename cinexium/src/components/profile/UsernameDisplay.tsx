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
          <svg className={`text-gray-400 flex-shrink-0 ${iconSize}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <title>Private Account</title>
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        ) : (
          <svg className={`text-gray-400 flex-shrink-0 ${iconSize}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <title>Public Account</title>
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
          </svg>
        )
      )}
      <span className="truncate min-w-0">@{username}</span>
      {isPremium && (
        <svg 
          className={`text-primary-500 ${iconSize} flex-shrink-0 drop-shadow-[0_0_8px_rgba(229,9,20,0.5)]`} 
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          <title>Premium User</title>
          <path d="M12 1L9 9l-8 3 8 3 3 8 3-8 8-3-8-3-3-8z" />
        </svg>
      )}
    </div>
  );
};
