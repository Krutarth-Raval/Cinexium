'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSocket } from '../providers/SocketProvider';

export const BottomNav = () => {
  const pathname = usePathname();
  const { hasUnreadMessages } = useSocket();

  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/verify-otp' ||
    pathname?.startsWith('/chat/') ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname === '/guidelines' ||
    pathname === '/contact'
  ) {
    return null;
  }

  const navItems = [
    {
      name: 'Home',
      href: '/',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      )
    },
    {
      name: 'Search',
      href: '/search',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      )
    },
    {
      name: 'Movies',
      href: '/movies',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m6.2 5.3 3.1 3.9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m12.4 3.4 3.1 4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
        </svg>
      )
    },

    {
      name: 'TV Shows',
      href: '/series',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <rect width="20" height="15" x="2" y="7" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="17 2 12 7 7 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },

    {
      name: 'Chat',
      href: '/chat',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
        </svg>
      )
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 bg-[#0f1115]/95 backdrop-blur-xl border-t border-white/10 z-50 pb-safe transform-gpu">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-primary-500' : 'text-gray-400 hover:text-gray-200'
                }`}
            >
              <div className={`relative transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
                {item.name === 'Chat' && hasUnreadMessages && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full z-20 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                )}
              </div>
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
