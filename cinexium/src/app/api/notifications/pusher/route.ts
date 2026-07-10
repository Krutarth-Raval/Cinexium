import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { targetUserId, type, actor } = data;

    if (!targetUserId || !type || !actor) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Trigger Pusher event on the target user's channel
    await pusherServer.trigger(`user-${targetUserId}`, 'receiveNotification', {
      targetUserId,
      type,
      actor
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('API Notification Pusher Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
