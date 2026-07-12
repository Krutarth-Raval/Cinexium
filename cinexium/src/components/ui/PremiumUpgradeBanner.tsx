import React from 'react';
import Link from 'next/link';

export function PremiumUpgradeBanner({ message, onCancel }: { message?: string, onCancel?: () => void }) {
  return (
    <div className="bg-gradient-to-r from-purple-900/30 to-fuchsia-900/30 border border-purple-500/30 rounded-2xl p-6 text-center shadow-[0_0_30px_rgba(168,85,247,0.1)] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-fuchsia-500/20 blur-[40px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/20 blur-[40px] rounded-full pointer-events-none" />

      <div className="relative z-10">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(168,85,247,0.5)]">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Cinexium Pro Required</h3>
        <p className="text-gray-300 text-sm mb-6">{message || "Upgrade to Cinexium Pro to unlock this feature and many more!"}</p>
        
        <div className="flex flex-col gap-3">
          <Link href="/premium" className="block w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-400 hover:to-fuchsia-500 text-white font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)]">
            View Pricing
          </Link>
          {onCancel && (
            <button 
              onClick={onCancel}
              className="block w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
