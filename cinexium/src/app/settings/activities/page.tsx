import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import { ActivitiesView } from '@/components/profile/ActivitiesView';
import { ClientBackButton } from '@/components/ui/ClientBackButton';

export default async function ActivitiesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen pt-4 md:pt-24 pb-24 px-4 max-w-4xl mx-auto md:hidden">
      <div className="flex items-center gap-2 mb-6">
        <ClientBackButton />
        <h1 className="text-xl md:text-2xl font-bold text-white">Your Activities</h1>
      </div>
      <div className="bg-[#1a1d24] rounded-2xl p-4 shadow-xl border border-white/5">
        <ActivitiesView />
      </div>
    </div>
  );
}
