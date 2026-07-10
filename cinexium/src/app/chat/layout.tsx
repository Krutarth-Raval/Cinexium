import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import ChatLayoutClient from '@/components/chat/ChatLayoutClient';
import { HiddenChatProvider } from '@/components/providers/HiddenChatProvider';

export const metadata: Metadata = {
  title: 'Messages | Cinexium',
  description: 'Chat with your friends on Cinexium.',
};

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  return (
    <HiddenChatProvider>
      <ChatLayoutClient>
        {children}
      </ChatLayoutClient>
    </HiddenChatProvider>
  );
}
