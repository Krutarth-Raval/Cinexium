import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const targetUser = await prisma.user.findUnique({ where: { username } });
    if (!targetUser) return NextResponse.json({ error: 'Target user not found' }, { status: 404 });

    if (user.id === targetUser.id) return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });

    // Check if block already exists
    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: { blockerId: user.id, blockedId: targetUser.id }
      }
    });

    if (existingBlock) {
      // Unblock
      await prisma.block.delete({
        where: { id: existingBlock.id }
      });
      revalidatePath(`/profile/${username}`);

      // Notify both users via Pusher
      await pusherServer.trigger([`user-${user.id}`, `user-${targetUser.id}`], 'blockStatusChanged', {
        blockerId: user.id,
        blockedId: targetUser.id,
        isBlocked: false
      });

      return NextResponse.json({ blocked: false });
    } else {
      // Block
      await prisma.block.create({
        data: { blockerId: user.id, blockedId: targetUser.id }
      });

      // When blocking, we must also remove follows in both directions
      await prisma.follows.deleteMany({
        where: {
          OR: [
            { followerId: user.id, followingId: targetUser.id },
            { followerId: targetUser.id, followingId: user.id }
          ]
        }
      });

      // We should also delete follow requests notifications
      await prisma.notification.deleteMany({
        where: {
          OR: [
            { userId: user.id, actorId: targetUser.id },
            { userId: targetUser.id, actorId: user.id }
          ]
        }
      });

      revalidatePath(`/profile/${username}`);

      // Notify both users via Pusher
      await pusherServer.trigger([`user-${user.id}`, `user-${targetUser.id}`], 'blockStatusChanged', {
        blockerId: user.id,
        blockedId: targetUser.id,
        isBlocked: true
      });

      return NextResponse.json({ blocked: true });
    }
  } catch (error) {
    console.error('Block API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
