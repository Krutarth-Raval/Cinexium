'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

function buildUpiUrl(params: {
  pa: string;
  pn: string;
  am: string;
  cu: string;
}) {
  const search = new URLSearchParams({
    pa: params.pa,
    pn: params.pn,
    am: params.am,
    cu: params.cu,
  });

  return `upi://pay?${search.toString()}`;
}

type PaymentLinkData = {
  pa: string;
  pn: string;
  am: string;
  cu: string;
  plan: string;
  paymentLinkExpiresAt: string;
  upiUrl: string;
};

export default function PremiumPayPage() {
  const searchParams = useSearchParams();
  const requestId = useMemo(() => searchParams.get('requestId') || '', [searchParams]);
  const [attemptedOpen, setAttemptedOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentLinkData | null>(null);

  useEffect(() => {
    const loadPaymentLink = async () => {
      if (!requestId) {
        setError('This payment link is missing required details.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/subscription-requests/${requestId}/payment-link`, {
          cache: 'no-store',
        });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || 'This payment link is no longer active.');
        }

        setPaymentData({
          ...data,
          upiUrl: buildUpiUrl({
            pa: data.pa,
            pn: data.pn,
            am: data.am,
            cu: data.cu,
          }),
        });
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'This payment link is no longer active.');
      } finally {
        setLoading(false);
      }
    };

    void loadPaymentLink();
  }, [requestId]);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || '';
    setIsMobileDevice(/android|iphone|ipad|ipod|mobile/i.test(userAgent));
  }, []);

  useEffect(() => {
    if (!paymentData || attemptedOpen || isExpired) {
      return;
    }

    if (!isMobileDevice) {
      return;
    }

    setAttemptedOpen(true);

    const timeoutId = window.setTimeout(() => {
      window.location.href = paymentData.upiUrl;
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [attemptedOpen, isExpired, isMobileDevice, paymentData]);

  useEffect(() => {
    if (!paymentData?.paymentLinkExpiresAt) {
      return;
    }

    const updateExpiry = () => {
      setIsExpired(new Date(paymentData.paymentLinkExpiresAt).getTime() <= Date.now());
    };

    updateExpiry();
    const intervalId = window.setInterval(updateExpiry, 1000);

    return () => window.clearInterval(intervalId);
  }, [paymentData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1115] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1a1d24] p-8 text-center">
          <h1 className="text-2xl font-bold mb-3">Loading Payment Link</h1>
          <p className="text-gray-400">Checking whether this payment link is still active.</p>
        </div>
      </div>
    );
  }

  if (!paymentData || isExpired) {
    return (
      <div className="min-h-screen bg-[#0f1115] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1a1d24] p-8 text-center">
          <h1 className="text-2xl font-bold mb-3">Payment Link Unavailable</h1>
          <p className="text-gray-400 mb-6">
            {isExpired ? 'This payment link has expired. Please request Premium again.' : error || 'This payment link is missing required details.'}
          </p>
          <Link href="/premium" className="inline-flex rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-600 px-5 py-3 font-semibold text-white">
            Back to Premium
          </Link>
        </div>
      </div>
    );
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(paymentData.upiUrl)}`;
  const openUpiApp = () => {
    window.location.href = paymentData.upiUrl;
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-[#1a1d24] p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-purple-300 mb-3">Cinexium Premium</p>
          <h1 className="text-3xl font-bold mb-3">{isMobileDevice ? 'Open Your UPI App' : 'Complete Payment Manually'}</h1>
          <p className="text-gray-400">
            {isMobileDevice
              ? 'We&apos;re trying to open your UPI app now. If nothing happens, use the button below.'
              : 'Desktop browsers usually cannot open UPI apps directly. Scan this QR code with any UPI app on your phone to complete payment.'}
          </p>
        </div>

        {!isMobileDevice && (
          <div className="mb-6 flex flex-col items-center rounded-3xl border border-white/5 bg-[#0f1115] p-5">
            {/* External QR image keeps the desktop fallback simple without adding a new package. */}
            <img
              src={qrCodeUrl}
              alt="UPI payment QR code"
              className="h-64 w-64 rounded-2xl bg-white p-3 shadow-lg"
            />
            <p className="mt-4 text-center text-sm text-gray-400">
              Scan this QR code with Google Pay, PhonePe, Paytm, or any UPI app on your mobile device.
            </p>
          </div>
        )}

        <div className="rounded-3xl border border-white/5 bg-[#0f1115] p-5 space-y-3 mb-6">
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400">Plan</span>
            <span className="font-medium text-white">{paymentData.plan}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400">Amount</span>
            <span className="font-medium text-white">
              <span style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>{'\u20B9'}</span>
              {paymentData.am}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400">UPI ID</span>
            <span className="font-medium text-white break-all text-right">{paymentData.pa}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400">Link Expires</span>
            <span className="font-medium text-white">
              {new Date(paymentData.paymentLinkExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {isMobileDevice ? (
            <a
              href={paymentData.upiUrl}
              className="block w-full rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-600 px-5 py-3 text-center font-semibold text-white"
            >
              Open UPI App
            </a>
          ) : (
            <button
              type="button"
              onClick={openUpiApp}
              className="block w-full rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-600 px-5 py-3 text-center font-semibold text-white"
            >
              Open UPI App
            </button>
          )}
          <Link
            href="/premium"
            className="block w-full rounded-2xl bg-white/10 px-5 py-3 text-center font-medium text-white transition-colors hover:bg-white/15"
          >
            Back to Premium
          </Link>
        </div>

        <p className="mt-5 text-xs text-gray-500 text-center">
          This payment link is valid for 10 minutes. If your device does not support UPI deep links from the browser, pay manually to the shown UPI ID and contact the admin before it expires.
        </p>
      </div>
    </div>
  );
}
