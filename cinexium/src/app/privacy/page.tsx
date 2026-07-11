'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicyPage() {
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
          <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        </div>

        <div className="prose prose-invert prose-p:text-gray-400 prose-headings:text-white max-w-none">
          <p className="lead text-lg mb-8">
            Your privacy is important to us. This Privacy Policy explains how Cinexium collects, uses, and protects your personal information.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">1. Information Collected</h2>
          <p className="mb-4">We collect various types of information to provide and improve our services to you:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-400">
            <li><strong>Google Sign-In Information:</strong> When you sign in using Google, we receive basic profile information such as your name, email address, and profile picture.</li>
            <li><strong>User-Generated Content:</strong> This includes any reviews, comments, and chats you create or participate in on the platform.</li>
            <li><strong>Watchlists and Preferences:</strong> We track the media you save, your ratings, and your general viewing preferences to provide personalized recommendations.</li>
            <li><strong>Cookies and Session Data:</strong> We use cookies to maintain your session and remember your region and language preferences.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4">2. How Information is Used</h2>
          <p className="mb-6">
            We use your information to operate, maintain, and improve Cinexium. This includes personalizing your feed, sending essential notifications, facilitating community interactions, and preventing fraudulent or abusive activity.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">3. Sharing with Trusted Service Providers</h2>
          <p className="mb-6">
            We do not sell your personal data. We only share information with trusted third-party service providers (like Cloudinary for image hosting or Pusher for real-time messaging) strictly for the purpose of operating the platform.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">4. Data Security</h2>
          <p className="mb-6">
            We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">5. Data Retention</h2>
          <p className="mb-6">
            We retain your information for as long as your account is active or as needed to provide you services. If you delete your account, we will systematically delete your personal data within a reasonable timeframe.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">6. User Rights</h2>
          <p className="mb-6">
            You have the right to access, update, or delete the personal information we have on you. You can manage your profile settings directly within the application.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">7. Account Deletion</h2>
          <p className="mb-6">
            If you wish to permanently delete your account and all associated data, you may do so through your account settings or by contacting our support team.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">8. Children's Privacy</h2>
          <p className="mb-6">
            Cinexium is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">9. Policy Updates</h2>
          <p className="mb-6">
            We may update our Privacy Policy from time to time. We will notify you of any significant changes by posting the new Privacy Policy on this page and updating the effective date.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">10. Contact Information</h2>
          <p className="mb-6">
            If you have any questions or concerns about this Privacy Policy, please reach out via our <Link href="/contact" className="text-primary-500 hover:underline">Contact Us</Link> page or email us directly at <a href="mailto:cinexium@gmail.com" className="text-primary-500 hover:underline">cinexium@gmail.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
