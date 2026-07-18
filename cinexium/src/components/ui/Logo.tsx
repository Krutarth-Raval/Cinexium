import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'mark';
}

export const Logo: React.FC<LogoProps> = ({ className, variant = 'full' }) => {
  if (variant === 'mark') {
    return (
      <svg
        className={className}
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="themeGradMark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-primary-500, #e50914)" />
            <stop offset="100%" stopColor="var(--color-primary-600, #b20710)" />
          </linearGradient>
          <mask id="filmMaskMark">
            <rect width="120" height="120" fill="white" />
            <path d="M 27 60 l 15 0" stroke="black" strokeWidth="6" strokeDasharray="8 8" />
            <path d="M 33 36 l 12 10" stroke="black" strokeWidth="6" strokeDasharray="8 8" />
            <path d="M 33 84 l 12 -10" stroke="black" strokeWidth="6" strokeDasharray="8 8" />
            <path d="M 55 21 l 10 12" stroke="black" strokeWidth="6" strokeDasharray="8 8" />
            <path d="M 55 99 l 10 -12" stroke="black" strokeWidth="6" strokeDasharray="8 8" />
          </mask>
        </defs>

        <g transform="translate(5, 5) scale(0.55)">
          <g mask="url(#filmMaskMark)">
            <path d="M 165.6 34.4 A 90 90 0 1 0 165.6 165.6 L 140.9 140.9 A 55 55 0 1 1 140.9 59.1 Z" fill="url(#themeGradMark)" />
          </g>
          <polygon points="90,70 90,130 135,100" fill="url(#themeGradMark)" />
        </g>
      </svg>
    );
  }

  return (
    <svg 
      className={className}
      viewBox="0 0 640 120" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="themeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary-500, #e50914)" />
          <stop offset="100%" stopColor="var(--color-primary-600, #b20710)" />
        </linearGradient>
        <mask id="filmMask">
          <rect width="200" height="200" fill="white" />
          <path d="M 27 100 l 15 0" stroke="black" strokeWidth="6" strokeDasharray="8 8" />
          <path d="M 33 60 l 12 10" stroke="black" strokeWidth="6" strokeDasharray="8 8" />
          <path d="M 33 140 l 12 -10" stroke="black" strokeWidth="6" strokeDasharray="8 8" />
          <path d="M 55 35 l 10 12" stroke="black" strokeWidth="6" strokeDasharray="8 8" />
          <path d="M 55 165 l 10 -12" stroke="black" strokeWidth="6" strokeDasharray="8 8" />
        </mask>
      </defs>
      
      <g transform="translate(10, 10) scale(0.5)">
        <g mask="url(#filmMask)">
          <path d="M 165.6 34.4 A 90 90 0 1 0 165.6 165.6 L 140.9 140.9 A 55 55 0 1 1 140.9 59.1 Z" fill="url(#themeGrad)"/>
        </g>
        <polygon points="90,70 90,130 135,100" fill="url(#themeGrad)" />
      </g>

      <text x="130" y="80" fontFamily="'Montserrat', 'Orbitron', 'Inter', system-ui, sans-serif" fontSize="52" fontWeight="800" fill="#ffffff" letterSpacing="8">
        C I N E <tspan fill="url(#themeGrad)">X</tspan> I U M
      </text>
    </svg>
  );
};
