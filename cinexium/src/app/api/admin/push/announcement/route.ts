import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { createPushNotification } from '@/lib/push/service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, username: true, name: true, avatar: true, role: true },
    });

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const title = typeof body.title === 'string' ? body.title.slice(0, 120) : '';
    const message = typeof body.body === 'string' ? body.body.slice(0, 240) : '';
    const deepLink = typeof body.deepLink === 'string' ? body.deepLink : '/';
    const image = typeof body.image === 'string' ? body.image : null;
    const type = body.type === 'MAINTENANCE_ALERT' ? 'MAINTENANCE_ALERT' : 'ADMIN_ANNOUNCEMENT';

    if (!title || !message) {
      return NextResponse.json({ error: 'Missing title or body' }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      select: { id: true },
    });

    await Promise.all(
      users.map((user) =>
        createPushNotification({
          userId: user.id,
          actor: admin,
          actorId: admin.id,
          type,
          title,
          body: message,
          deepLink,
          image,
          eventKey: `admin-broadcast:${type}:${title}:${user.id}`,
        })
      )
    );

    return NextResponse.json({ success: true, count: users.length });
  } catch (error) {
    console.error('Admin announcement push error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
