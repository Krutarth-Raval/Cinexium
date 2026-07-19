import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { getLatestMessagePushDebug, getPushDebugPipeline, logPushDebug } from '@/lib/push/debug';

const ALLOWED_STEPS = new Set([
  'sw_background_message_received',
  'sw_show_notification_called',
  'sw_notification_displayed',
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventKey = typeof body.eventKey === 'string' ? body.eventKey.slice(0, 256) : '';
    const step = typeof body.step === 'string' ? body.step : '';
    const type = typeof body.type === 'string' ? body.type.slice(0, 64) : 'UNKNOWN';
    const source = typeof body.source === 'string' ? body.source.slice(0, 64) : 'service-worker';
    const data = body && typeof body.data === 'object' && body.data ? body.data : {};

    if (!eventKey || !ALLOWED_STEPS.has(step)) {
      return NextResponse.json({ error: 'Invalid debug payload' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const user = session?.user?.email
      ? await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        })
      : null;

    logPushDebug({
      eventKey,
      source,
      type,
      userId: user?.id || 'service-worker',
      step: step as 'sw_background_message_received' | 'sw_show_notification_called' | 'sw_notification_displayed',
      data: {
        ...data,
        reportedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push debug route error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventKey = req.nextUrl.searchParams.get('eventKey');
    const pipeline = eventKey ? getPushDebugPipeline(eventKey) : getLatestMessagePushDebug();
    return NextResponse.json({ pipeline });
  } catch (error) {
    console.error('Push debug read error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
