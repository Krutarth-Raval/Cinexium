"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClientBackButton } from '@/components/ui/ClientBackButton';
import Script from 'next/script';
import Link from 'next/link';

export default function PremiumPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  let monthlyPrice = 2.99;
  let yearlyPrice = 29.99;
  let currencySymbol = '$';

  if (userData?.country === 'India' || userData?.country === 'IN') {
    monthlyPrice = 99;
    yearlyPrice = 999;
    currencySymbol = '₹';
  }

  useEffect(() => {
    fetch('/api/user/me')
      .then(async res => {
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      })
      .then(data => {
        if (data.user) setUserData(data.user);
      })
      .catch(console.error);
  }, []);

  const handleSubscribe = async () => {
    if (!termsAccepted) {
      alert("Please accept the Terms & Conditions first.");
      return;
    }
    
    setIsProcessing(true);
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: isYearly ? 'yearly' : 'monthly' })
      });
      const order = await res.json();

      if (order.error) throw new Error(order.error);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Cinexium Pro",
        description: `Upgrade to Cinexium Pro (${isYearly ? 'Yearly' : 'Monthly'})`,
        order_id: order.id,
        handler: async function (response: any) {
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: order.notes.userId,
              plan: order.notes.plan
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            window.location.href = '/settings/account?upgrade=success';
          } else {
            alert("Payment verification failed.");
          }
        },
        theme: {
          color: "#a855f7"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert("Payment failed. Please try again.");
      });
      rzp.open();
    } catch (error) {
      console.error(error);
      alert("Failed to initiate payment. Are you logged in?");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] pt-24 pb-24 px-4 overflow-hidden relative">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
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
                {currencySymbol}0 <span className="text-lg text-gray-500 font-normal">/forever</span>
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
                    Up to 3 Custom Collections
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
                {currencySymbol}{isYearly ? yearlyPrice : monthlyPrice} <span className="text-lg text-gray-400 font-normal">/{isYearly ? 'yr' : 'mo'}</span>
              </div>

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
                    Exclusive neon purple Pro badge
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    Pay-to-use premium chat rooms
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
                  I agree to the <Link href="/terms" className="text-purple-400 hover:underline" target="_blank">Terms & Conditions</Link>. I understand that all purchases are final and there are <strong>no refunds</strong>, even upon account deletion.
                </label>
              </div>

              <button 
                onClick={handleSubscribe}
                disabled={isProcessing}
                className={`w-full py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all active:scale-95 relative z-10 ${
                  isProcessing 
                    ? 'bg-gray-600 text-gray-300 cursor-wait' 
                    : 'bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-400 hover:to-fuchsia-500 text-white hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]'
                }`}
              >
                {isProcessing ? 'Processing...' : 'Subscribe Now'}
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
