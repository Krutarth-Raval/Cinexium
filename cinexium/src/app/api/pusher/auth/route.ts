import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { enforceSameOrigin, normalizeText } from '@/lib/security';
import { getGroupChannelName, getUserChannelName, pusherServer } from '@/lib/pusher';

const GROUP_CHANNEL_PREFIX = getGroupChannelName('');

export async function POST(req: NextRequest) {
  try {
    const originError = enforceSameOrigin(req);
    if (originError) return originError;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id?: string };
    if (!user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const socketId = normalizeText(formData.get('socket_id'), 200);
    const channelName = normalizeText(formData.get('channel_name'), 200);

    if (!socketId || !channelName) {
      return NextResponse.json({ error: 'Invalid auth payload' }, { status: 400 });
    }

    if (channelName === getUserChannelName(user.id)) {
      const auth = pusherServer.authorizeChannel(socketId, channelName);
      return NextResponse.json(auth);
    }

    if (channelName.startsWith(GROUP_CHANNEL_PREFIX)) {
      const groupId = normalizeText(channelName.slice(GROUP_CHANNEL_PREFIX.length), 64);
      if (!groupId) {
        return NextResponse.json({ error: 'Invalid channel' }, { status: 400 });
      }

      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: user.id } },
      });

      if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const auth = pusherServer.authorizeChannel(socketId, channelName);
      return NextResponse.json(auth);
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
