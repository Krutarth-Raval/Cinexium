import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="hidden lg:flex w-full py-6 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-[#0f1115] text-gray-400 text-sm items-center justify-between flex-col md:flex-row gap-4 mt-auto">
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
