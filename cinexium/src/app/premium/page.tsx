"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

import { ClientBackButton } from '@/components/ui/ClientBackButton';
import type { PricingResponse } from '@/lib/pricing';

type PremiumUser = {
  isPremium: boolean;
  premiumType?: string | null;
  premiumUntil?: string | null;
};

type SubscriptionRequestState = {
  id: string;
  plan: string;
  status: string;
  buttonLabel: string;
  disabled: boolean;
  requestedAt: string;
  actionExpiresAt: string | null;
  paymentEmailSent: boolean;
};

export default function PremiumPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userData, setUserData] = useState<PremiumUser | null>(null);
  const [pricing, setPricing] = useState<PricingResponse | null>(null);
  const [isPricingLoading, setIsPricingLoading] = useState(true);
  const [pricingError, setPricingError] = useState('');
  const [modalStatus, setModalStatus] = useState<'success' | 'error' | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [requestState, setRequestState] = useState<SubscriptionRequestState | null>(null);

  useEffect(() => {
    const loadPageData = async () => {
      try {
        const [userRes, pricingRes, requestRes] = await Promise.all([
          fetch('/api/user/me', { cache: 'no-store' }),
          fetch('/api/pricing', { cache: 'no-store' }),
          fetch('/api/subscription-requests', { cache: 'no-store' }),
        ]);

        if (userRes.ok) {
          const userResponse = await userRes.json();
          if (userResponse.user) {
            setUserData(userResponse.user);
          }
        }

        if (!pricingRes.ok) {
          throw new Error('Pricing is unavailable right now.');
        }

        const pricingResponse = await pricingRes.json();
        setPricing(pricingResponse);
        setPricingError('');

        if (requestRes.ok) {
          const requestResponse = await requestRes.json();
          setRequestState(requestResponse.request || null);
        } else if (requestRes.status !== 401) {
          setRequestState(null);
        }
      } catch (error) {
        console.error(error);
        setPricingError('Unable to load pricing right now. Please try again in a moment.');
      } finally {
        setIsPricingLoading(false);
      }
    };

    void loadPageData();
  }, []);

  useEffect(() => {
    const handleUserProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<PremiumUser>;
      if (!customEvent.detail) {
        return;
      }

      setUserData(customEvent.detail);
      if (customEvent.detail.isPremium) {
        setRequestState(null);
      }
    };

    window.addEventListener('userProfileUpdated', handleUserProfileUpdated);

    return () => {
      window.removeEventListener('userProfileUpdated', handleUserProfileUpdated);
    };
  }, []);

  useEffect(() => {
    if (!requestState?.actionExpiresAt) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (new Date(requestState.actionExpiresAt!).getTime() <= Date.now()) {
        setRequestState(null);
      }
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, [requestState]);

  const handleSubscribe = async () => {
    if (!termsAccepted) {
      setModalTitle('Action Required');
      setModalStatus('error');
      setModalMessage('Please accept the Terms & Conditions first.');
      return;
    }

    if (!pricing) {
      setModalTitle('Pricing Unavailable');
      setModalStatus('error');
      setModalMessage(pricingError || 'Pricing is unavailable right now. Please try again shortly.');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/subscription-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: isYearly ? 'yearly' : 'monthly',
        }),
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        if (response.status === 409 && data?.request) {
          setRequestState(data.request);
        }
        setModalTitle('Request Failed');
        setModalStatus('error');
        setModalMessage(data?.error || 'Failed to submit your subscription request.');
        return;
      }

      const data = await response.json().catch(() => null);

      setModalTitle('Request Submitted');
      setModalStatus('success');
      setModalMessage('Your subscription request has been received successfully.\n\nWe will send your payment details to your registered email shortly.\n\nIf you don\'t receive an email within a few hours, you may submit another request.');
      setRequestState(data?.request || null);
    } catch (error) {
      console.error(error);
      setModalTitle('Request Failed');
      setModalStatus('error');
      setModalMessage('Failed to submit your subscription request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] pt-24 pb-24 px-4 overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-12">
          <ClientBackButton />
          <h1 className="text-xl md:text-3xl font-bold text-white">Upgrade to Premium</h1>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500 mb-6 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            {userData?.isPremium ? 'Cinexium Pro' : 'Unlock Cinexium Pro'}
          </h2>
          {!userData?.isPremium && (
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Get exclusive features, priority access, and a custom neon purple badge to stand out in the community.
            </p>
          )}
        </div>

        {/* Toggle (Hide if already premium) */}
        {!userData?.isPremium && (
          <div className="flex justify-center mb-12">
            <div className="bg-[#1a1d24] p-1 rounded-full border border-white/10 flex items-center relative">
              <div
                className={`absolute top-1 bottom-1 w-[120px] bg-gradient-to-r from-purple-500 to-fuchsia-600 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.4)] ${
                  isYearly ? 'left-[124px]' : 'left-1'
                }`}
              />
              <button
                onClick={() => setIsYearly(false)}
                className={`w-[120px] py-2 text-sm font-medium z-10 transition-colors ${!isYearly ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`w-[120px] py-2 text-sm font-medium z-10 transition-colors flex items-center justify-center gap-2 ${isYearly ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Yearly
                {!isYearly && <span className="bg-purple-500/20 text-purple-400 text-[10px] px-1.5 py-0.5 rounded-md">-16%</span>}
              </button>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        {userData?.isPremium ? (
          <div className="max-w-xl mx-auto">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-[#1a1d24]/80 backdrop-blur-xl border border-purple-500/50 rounded-3xl p-8 flex flex-col h-full relative overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.2)]"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/20 blur-[50px]" />

              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
              </div>

              <h3 className="text-3xl font-bold text-white text-center mb-2">Your Plan</h3>
              <p className="text-gray-400 text-center mb-8 text-sm">
                Thank you for subscribing to Cinexium Pro. Your account is fully upgraded.
              </p>

              <div className="space-y-4 text-gray-200 text-sm bg-white/5 p-6 rounded-2xl border border-white/10 relative z-10">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-gray-400">Plan</span>
                  <span className="font-semibold text-white capitalize">{userData.premiumType || 'Monthly'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-gray-400">Status</span>
                  <span className="font-semibold text-green-400 bg-green-400/10 px-2 py-0.5 rounded">Active</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Renews on</span>
                  <span className="font-semibold text-white">
                    {userData.premiumUntil ? new Date(userData.premiumUntil).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              <Link href="/settings/account" className="mt-8 block text-center w-full py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all active:scale-95 relative z-10 bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-400 hover:to-fuchsia-500 text-white hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]">
                Manage Account
              </Link>
            </motion.div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Tier */}
            <div className="bg-[#1a1d24]/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 flex flex-col h-full opacity-80 hover:opacity-100 transition-opacity">
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <p className="text-gray-400 text-sm mb-6">For casual movie lovers.</p>
              <div className="text-4xl font-black text-white mb-8">
                <span style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>{pricing?.symbol ?? ''}</span>0 <span className="text-lg text-gray-500 font-normal">/forever</span>
              </div>

              <div className="flex-1">
                <ul className="space-y-4 text-gray-300 text-sm">
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Track movies and series
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Join the community chat
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Create & save up to 2 Custom Collections
                  </li>
                </ul>
              </div>

              <button disabled className="mt-8 w-full py-3 rounded-xl bg-white/5 text-gray-500 font-bold cursor-not-allowed">
                Current Plan
              </button>
            </div>

            {/* Premium Tier */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-[#1a1d24]/80 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-8 flex flex-col h-full relative overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:shadow-[0_0_50px_rgba(168,85,247,0.25)] transition-shadow"
            >
              {/* Inner Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/20 blur-[50px]" />

              <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                Pro <span className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow-[0_0_10px_rgba(168,85,247,0.5)]">Popular</span>
              </h3>
              <p className="text-gray-400 text-sm mb-6">For the ultimate cinema tracking experience.</p>
              <div className="text-4xl font-black text-white mb-8">
                {isPricingLoading ? (
                  <span className="text-lg text-gray-400 font-normal">Loading pricing...</span>
                ) : pricing ? (
                  <>
                    <span style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>{pricing.symbol}</span>
                    {isYearly ? pricing.yearly : pricing.monthly} <span className="text-lg text-gray-400 font-normal">/{isYearly ? 'yr' : 'mo'}</span>
                  </>
                ) : (
                  <span className="text-lg text-red-300 font-normal">Pricing unavailable</span>
                )}
              </div>
              {pricingError && (
                <p className="text-sm text-red-300 mb-6 relative z-10">{pricingError}</p>
              )}

              <div className="flex-1 relative z-10">
                <ul className="space-y-4 text-gray-200 text-sm">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    Unlimited Collections
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    Pin collections to profile
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    Exclusive Pro badge matching your theme
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    Create and manage Pro-exclusive Communities
                  </li>
                </ul>
              </div>

              <div className="mt-6 mb-4 flex items-start gap-3 z-10 relative">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-900 bg-gray-800 cursor-pointer"
                />
                <label htmlFor="terms" className="text-xs text-gray-400 cursor-pointer">
                  I agree to the <Link href="/terms" className="text-purple-400 hover:underline" target="_blank">Terms & Conditions</Link> and Refund Policy.
                </label>
              </div>

              <button
                onClick={handleSubscribe}
                disabled={isProcessing || isPricingLoading || !pricing || requestState?.disabled}
                className={`w-full py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all active:scale-95 relative z-10 ${
                  isProcessing || isPricingLoading || !pricing || requestState?.disabled
                    ? 'bg-gray-600 text-gray-300 cursor-wait'
                    : 'bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-400 hover:to-fuchsia-500 text-white hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]'
                }`}
              >
                {isProcessing ? 'Processing...' : isPricingLoading ? 'Loading...' : requestState?.disabled ? requestState.buttonLabel : 'Request Pro'}
              </button>
              {requestState?.disabled && requestState.actionExpiresAt && (
                <p className="mt-3 text-center text-xs text-gray-400">
                  {requestState.status === 'WAITING_FOR_PAYMENT'
                    ? `Payment link expires at ${new Date(requestState.actionExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
                    : `You can send another request after ${new Date(requestState.actionExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`}
                </p>
              )}
            </motion.div>
          </div>
        )}
      </div>

      {/* Payment Status Modal */}
      <AnimatePresence>
        {modalStatus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setModalStatus(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#1a1d24] border border-white/10 p-8 rounded-3xl max-w-md w-full relative z-10 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex justify-center mb-6">
                {modalStatus === 'success' ? (
                  <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center text-5xl">
                    <svg className="w-12 h-12 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center text-5xl">
                    <svg className="w-12 h-12 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{modalTitle}</h3>
              <p className="text-gray-400 mb-8 whitespace-pre-line">{modalMessage}</p>

              <button
                onClick={() => setModalStatus(null)}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
