import { VerifyOtpForm } from '@/components/auth/VerifyOtpForm';
import { AuthBackground } from '@/components/auth/AuthBackground';
import { Suspense } from 'react';

export default function VerifyOtpPage() {
  return (
    <main className="h-[100dvh] overflow-hidden md:min-h-screen md:overflow-auto relative flex items-center justify-center p-4">
      <AuthBackground />
      <Suspense fallback={<div className="w-full max-w-md p-8 bg-[#0f1115]/80 backdrop-blur-xl rounded-3xl animate-pulse h-64 z-20" />}>
        <VerifyOtpForm />
      </Suspense>
    </main>
  );
}
