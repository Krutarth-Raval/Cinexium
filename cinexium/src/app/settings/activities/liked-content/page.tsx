import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ClientBackButton } from '@/components/ui/ClientBackButton';

const likedContentLinks = [
  { href: '/settings/activities/liked-collections', label: 'Liked Collections' },
  { href: '/settings/activities/liked-media', label: 'Liked Media' },
  { href: '/settings/activities/liked-comments', label: 'Liked Comments' },
];

export default async function LikedContentPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 pt-4 md:pt-24 pb-24">
      <div className="flex items-center gap-4 mb-8">
        <ClientBackButton />
        <h1 className="text-xl md:text-3xl font-bold text-white">Liked Content</h1>
      </div>

      <div className="bg-[#1a1d24] rounded-2xl shadow-xl border border-white/5 overflow-hidden">
        {likedContentLinks.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between p-4 hover:bg-white/5 transition-colors group ${
              index !== likedContentLinks.length - 1 ? 'border-b border-white/5' : ''
            }`}
          >
            <span className="text-white font-medium group-hover:text-primary-400 transition-colors">{item.label}</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-500 group-hover:text-primary-500 transition-colors">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
