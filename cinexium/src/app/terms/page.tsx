'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TermsOfServicePage() {
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
          <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
        </div>

        <div className="prose prose-invert prose-p:text-gray-400 prose-headings:text-white max-w-none">
          <p className="lead text-lg mb-8">
            Welcome to Cinexium. By using our platform, you agree to these Terms of Service. Please read them carefully.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="mb-6">
            By accessing or using Cinexium, you agree to be bound by these terms. If you disagree with any part of the terms, you may not access the service.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">2. Eligibility to Use the Service</h2>
          <p className="mb-6">
            You must be at least 13 years old to use Cinexium. By using the service, you represent and warrant that you meet this requirement.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">3. User Accounts</h2>
          <p className="mb-6">
            When you create an account, you must provide accurate and complete information. You are solely responsible for the activity that occurs on your account and must keep your account password secure.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">4. Acceptable Use</h2>
          <p className="mb-6">
            You agree not to engage in any activity that interferes with or disrupts the service, or attempts to access the service using a method other than the interface and instructions we provide.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">5. Community Rules</h2>
          <p className="mb-6">
            We are committed to maintaining a safe community. You must comply with our <Link href="/guidelines" className="text-primary-500 hover:underline">Community Guidelines</Link> at all times while interacting with other users.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">6. User-Generated Content</h2>
          <p className="mb-6">
            You retain ownership of the content you post on Cinexium. However, by posting, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and distribute that content in connection with the service.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">7. Intellectual Property</h2>
          <p className="mb-6">
            The Cinexium platform, including its original content, features, and functionality, are owned by Cinexium and are protected by international copyright and trademark laws.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">8. Premium Subscription</h2>
          <p className="mb-6">
            Premium subscriptions are currently processed manually by the Cinexium team.
          </p>
          <p className="mb-6">
            Clicking Request Pro only submits a subscription request and does not activate your Premium subscription.
          </p>
          <p className="mb-6">
            Payment instructions will be sent to your registered email after your request has been reviewed.
          </p>
          <p className="mb-6">
            Payments are accepted only through the official UPI details provided in the payment email sent by Cinexium.
          </p>
          <p className="mb-6">
            Premium access is activated only after the payment has been successfully verified by the Cinexium team.
          </p>
          <p className="mb-6">
            Monthly subscriptions remain active for 1 month, and Yearly subscriptions remain active for 1 year, starting from the activation date.
          </p>
          <p className="mb-6">
            Premium subscriptions do not renew automatically. After expiration, you must submit a new Premium request if you wish to continue.
          </p>
          <p className="mb-6">
            Subscription requests may be cancelled if payment is not completed within a reasonable time.
          </p>
          <p className="mb-6">
            Premium subscriptions are linked to your Cinexium account and cannot be transferred to another account.
          </p>
          <p className="mb-6">
            Once a Premium subscription has been activated, payments are generally non-refundable, except where required by applicable law.
          </p>
          <p className="mb-6">
            Cinexium reserves the right to update Premium features, pricing, or these Terms & Conditions at any time. Changes will not affect subscriptions that are already active until their current subscription period ends.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">9. Service Availability</h2>
          <p className="mb-6">
            We do not guarantee that the service will always be safe, secure, or error-free. We may suspend or terminate the service at any time without notice.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">10. Account Suspension or Termination</h2>
          <p className="mb-6">
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">11. Disclaimer of Warranties</h2>
          <p className="mb-6">
            The service is provided on an "AS IS" and "AS AVAILABLE" basis. Cinexium makes no representations or warranties of any kind, express or implied.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">12. Limitation of Liability</h2>
          <p className="mb-6">
            In no event shall Cinexium be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the service.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">13. Governing Law</h2>
          <p className="mb-6">
            These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Cinexium operates, without regard to its conflict of law provisions.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">14. Changes to the Terms</h2>
          <p className="mb-6">
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days notice prior to any new terms taking effect.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">15. TMDB Disclaimer</h2>
          <p className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">16. Contact Information</h2>
          <p className="mb-6">
            If you have any questions about these Terms, please reach out via our <Link href="/contact" className="text-primary-500 hover:underline">Contact Us</Link> page or email us directly at <a href="mailto:cinexium@gmail.com" className="text-primary-500 hover:underline">cinexium@gmail.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
