'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CommunityGuidelinesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0f1115] text-gray-200 selection:bg-primary-500/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Top Bar with Back Arrow */}
        <div className="flex items-center gap-4 mb-10 border-b border-white/10 pb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-white">Community Guidelines</h1>
        </div>

        <div className="prose prose-invert prose-p:text-gray-400 prose-headings:text-white max-w-none">
          <p className="lead text-lg mb-8">
            Cinexium is a place for movie and TV enthusiasts to connect. To keep this community welcoming and safe, we ask that you follow these guidelines.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">1. Be Respectful</h2>
          <p className="mb-6">
            Treat others as you would like to be treated. Disagreements over movie opinions are fine, but personal attacks are not.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">2. No Harassment or Hate Speech</h2>
          <p className="mb-6">
            We have a zero-tolerance policy for harassment, bullying, or hate speech based on race, ethnicity, religion, gender, sexual orientation, or disability.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">3. No Spam</h2>
          <p className="mb-6">
            Do not flood chats, comments, or reviews with repetitive content, self-promotion, or irrelevant links.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">4. No Scams or Phishing</h2>
          <p className="mb-6">
            Posting malicious links, attempting to steal user credentials, or engaging in fraudulent activity will result in an immediate ban.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">5. No Illegal Activity</h2>
          <p className="mb-6">
            Do not use Cinexium to coordinate, promote, or participate in any illegal activities.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">6. No Piracy Links</h2>
          <p className="mb-6">
            Do not share links to unauthorized downloads, illegal streams, or torrents of copyrighted material.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">7. No Impersonation</h2>
          <p className="mb-6">
            Do not impersonate other users, public figures, or Cinexium staff members.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">8. Respect Spoilers (If Applicable)</h2>
          <p className="mb-6">
            When discussing plot details of newly released movies or episodes, please use appropriate spoiler warnings or tags so others can enjoy the content.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">9. Report Inappropriate Content</h2>
          <p className="mb-6">
            If you see someone violating these rules, please use the reporting features available on the platform or block the user directly to maintain your personal safety.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">10. Consequences for Violations</h2>
          <p className="mb-6">
            Violating these guidelines may result in content removal, temporary suspension, or permanent account termination, depending on the severity of the offense.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">11. Contact Information</h2>
          <p className="mb-6">
            If you have any questions or concerns regarding our community guidelines, please reach out via our <Link href="/contact" className="text-primary-500 hover:underline">Contact Us</Link> page or email us directly at <a href="mailto:cinexium@gmail.com" className="text-primary-500 hover:underline">cinexium@gmail.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
