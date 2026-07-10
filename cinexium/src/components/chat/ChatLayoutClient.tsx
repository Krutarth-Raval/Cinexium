'use client';

import { usePathname } from 'next/navigation';
import ChatSidebar from '@/components/chat/ChatSidebar';

export default function ChatLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChatWindowOpen = pathname.split('/').length > 2; // e.g., /chat/username

  return (
    <div className={`fixed inset-0 flex flex-col bg-[#0f1115] md:pt-24 md:px-8 md:pb-6 pt-0 pb-0 px-0`}>
      <div className="flex-1 flex overflow-hidden md:border md:border-white/10 md:rounded-2xl md:shadow-2xl bg-[#15181e]">
        {/* Sidebar */}
        <div 
          className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-white/10 bg-[#15181e] flex flex-col h-full min-h-0 ${isChatWindowOpen ? 'hidden md:flex' : 'flex'}`}
        >
          <ChatSidebar />
        </div>
        
        {/* Main Chat Area */}
        <div 
          className={`flex-1 bg-[#1a1d24] relative h-full min-h-0 ${!isChatWindowOpen ? 'hidden md:flex' : 'flex'} flex-col`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
