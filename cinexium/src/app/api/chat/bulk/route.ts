import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { enforceSameOrigin } from '@/lib/security';

type BulkChatItem = {
  id: string;
  isGroup?: boolean;
  isContactOnly?: boolean;
};

export async function POST(req: NextRequest) {
  try {
    const originError = enforceSameOrigin(req);
    if (originError) return originError;

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const action = typeof body.action === 'string' ? body.action : '';
    const items = Array.isArray(body.items) ? (body.items as BulkChatItem[]) : [];

    if (!['pin', 'unpin', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const actionableItems = items.filter((item) => item?.id && !item.isContactOnly);
    if (actionableItems.length === 0) {
      return NextResponse.json({ success: true });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of actionableItems) {
        if (item.isGroup) {
          const membership = await tx.groupMember.findUnique({
            where: { groupId_userId: { groupId: item.id, userId: user.id } },
            select: { id: true, role: true },
          });

          if (!membership) {
            continue;
          }

          if (action === 'pin' || action === 'unpin') {
            await tx.groupMember.update({
              where: { id: membership.id },
              data: { isPinned: action === 'pin' },
            });
            continue;
          }

          const group = await tx.groupChat.findUnique({
            where: { id: item.id },
            include: {
              members: {
                select: { userId: true, role: true },
              },
            },
          });

          if (!group) {
            continue;
          }

          if (membership.role === 'ADMIN') {
            const adminCount = group.members.filter((member) => member.role === 'ADMIN').length;
            if (adminCount === 1 && group.members.length > 1) {
              throw new Error('You are the only admin in one of the selected groups. Promote someone else before leaving.');
            }
          }

          await tx.groupMember.delete({
            where: { groupId_userId: { groupId: item.id, userId: user.id } },
          });

          if (group.members.length === 1) {
            await tx.groupChat.delete({
              where: { id: item.id },
            });
          }
          continue;
        }

        const conversation = await tx.conversation.findUnique({
          where: { id: item.id },
          select: { id: true, user1Id: true, user2Id: true },
        });

        if (!conversation || (conversation.user1Id !== user.id && conversation.user2Id !== user.id)) {
          continue;
        }

        const isUser1 = conversation.user1Id === user.id;
        const otherUserId = isUser1 ? conversation.user2Id : conversation.user1Id;

        if (action === 'pin' || action === 'unpin') {
          await tx.conversation.update({
            where: { id: conversation.id },
            data: isUser1
              ? { isPinnedByUser1: action === 'pin' }
              : { isPinnedByUser2: action === 'pin' },
          });
          continue;
        }

        await tx.message.updateMany({
          where: { conversationId: conversation.id, senderId: user.id },
          data: { isDeletedBySender: true },
        });

        await tx.message.updateMany({
          where: { conversationId: conversation.id, senderId: otherUserId },
          data: { isDeletedByReceiver: true },
        });

        await tx.conversation.update({
          where: { id: conversation.id },
          data: isUser1 ? { isHiddenByUser1: true } : { isHiddenByUser2: true },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bulk chat action error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
