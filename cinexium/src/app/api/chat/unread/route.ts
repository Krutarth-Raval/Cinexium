import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ hasUnread: false });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ hasUnread: false });

    if (!user.chatNotifications) {
      return NextResponse.json({ hasUnread: false });
    }

    const unreadCount = await prisma.message.count({
      where: {
        senderId: { not: user.id },
        isRead: false,
        isDeletedByReceiver: false,
        conversation: {
          OR: [
            { user1Id: user.id },
            { user2Id: user.id }
          ]
        }
      }
    });

    return NextResponse.json({ hasUnread: unreadCount > 0 });
  } catch (error) {
    console.error('Unread chat count error:', error);
    return NextResponse.json({ hasUnread: false });
  }
}
