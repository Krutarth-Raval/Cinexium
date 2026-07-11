'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Footer = () => {
  const pathname = usePathname();
  
  // Bottom nav is hidden on these routes, so on mobile we can show the footer
  const isBottomNavVisible = !(
    pathname === '/login' || 
    pathname === '/register' || 
    pathname === '/verify-otp' || 
    pathname?.startsWith('/chat/') ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname === '/guidelines' ||
    pathname === '/contact'
  );

  // If BottomNav is visible (on mobile), hide Footer on mobile using hidden md:flex
  // If BottomNav is NOT visible, we can show Footer everywhere using flex
  const displayClass = isBottomNavVisible ? 'hidden md:flex' : 'flex';

  return (
    <footer className={`${displayClass} w-full py-6 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-[#0f1115] text-gray-400 text-sm items-center justify-between flex-col md:flex-row gap-4 mt-auto`}>
      <div className="flex items-center gap-6">
        <span>&copy; {new Date().getFullYear()} Cinexium.</span>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
          <Link href="/guidelines" className="hover:text-white transition-colors">Community Guidelines</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span>Powered by</span>
        <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors font-bold text-primary-500">
          TMDB
        </a>
      </div>
    </footer>
  );
};
