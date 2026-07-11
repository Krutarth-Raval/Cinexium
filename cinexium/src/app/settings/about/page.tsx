import React from 'react';
import Link from 'next/link';
import { ClientBackButton } from '@/components/ui/ClientBackButton';

export default function AboutSettingsPage() {
  const links = [
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Community Guidelines', href: '/guidelines' },
    { label: 'Contact Us', href: '/contact' },
  ];

  return (
    <div className="min-h-screen pt-4 md:pt-24 pb-24 px-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <ClientBackButton />
        <h1 className="text-xl md:text-3xl font-bold text-white">About & Legal</h1>
      </div>

      <div className="bg-[#1a1d24] rounded-2xl p-2 shadow-xl border border-white/5">
        <div className="flex flex-col">
          {links.map((link, index) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={`flex items-center justify-between p-4 hover:bg-white/5 transition-colors group ${index !== links.length - 1 ? 'border-b border-white/5' : ''}`}
            >
              <span className="text-white font-medium group-hover:text-primary-400 transition-colors">{link.label}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-500 group-hover:text-primary-500 transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
