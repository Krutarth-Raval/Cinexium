import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;

    const group = await prisma.groupChat.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, name: true, avatar: true, isPremium: true } } },
          orderBy: { role: 'asc' }
        },
        messages: {
          include: { 
            sender: { select: { id: true, username: true, name: true, avatar: true, isPremium: true } },
            reactions: { include: { user: { select: { id: true, name: true, username: true, avatar: true } } } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Check membership
    const isMember = group.members.some(m => m.userId === user.id);
    
    // Fetch blocks involving the current user
    const blocks = await prisma.block.findMany({
      where: {
        OR: [
          { blockerId: user.id },
          { blockedId: user.id }
        ]
      }
    });
    
    const blockedUserIds = new Set(
      blocks.flatMap(b => [b.blockerId, b.blockedId]).filter(id => id !== user.id)
    );

    // Add isBlocked flag to members
    const maskedMembers = group.members.map(m => ({
      ...m,
      user: {
        ...m.user,
        isBlocked: blockedUserIds.has(m.user.id)
      }
    }));

    // Add isBlocked flag to message senders
    const maskedMessages = group.messages.map(msg => ({
      ...msg,
      sender: {
        ...msg.sender,
        isBlocked: blockedUserIds.has(msg.sender.id)
      }
    }));

    if (!isMember) {
      // If not a member, return group info without messages
      return NextResponse.json({ ...group, members: maskedMembers, messages: [], isMember: false });
    }

    return NextResponse.json({ ...group, members: maskedMembers, messages: maskedMessages, isMember: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;

    const body = await req.json();
    const { action, name, memberId, role } = body;

    const group = await prisma.groupChat.findUnique({
      where: { id },
      include: { members: true }
    });

    if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const member = group.members.find(m => m.userId === user.id);

    // Allow users to join if they use the 'join' action
    if (action === 'join') {
      if (member) return NextResponse.json({ error: 'Already a member' }, { status: 400 });
      
      const { inviteCode } = body;
      
      // If community is premium-only, check if user is premium
      if (group.isPremiumOnly) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!dbUser?.isPremium) {
          return NextResponse.json({ error: 'This is a Cinexium Pro exclusive community. Upgrade to Pro to join!', premiumRequired: true }, { status: 403 });
        }
      }

      if (group.isCommunity && group.isPublic) {
        // Public communities can be joined directly
      } else if (group.inviteCode && group.inviteCode === inviteCode) {
        // Valid invite code
      } else {
         return NextResponse.json({ error: 'Invalid invite code or community is private. Please request to join.' }, { status: 403 });
      }

      await prisma.groupMember.create({
        data: { groupId: id, userId: user.id, role: 'MEMBER' }
      });
      return NextResponse.json({ success: true });
    }

    if (!member || member.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    if (action === 'updateInfo') {
      const updated = await prisma.groupChat.update({
        where: { id },
        data: { name }
      });
      return NextResponse.json(updated);
    } 
    
    if (action === 'updateMessagePermission') {
      const { messagePermission } = body;
      const updated = await prisma.groupChat.update({
        where: { id },
        data: { messagePermission }
      });
      return NextResponse.json(updated);
    }

    if (action === 'removeMember') {
      if (memberId === user.id) return NextResponse.json({ error: 'Cannot remove self' }, { status: 400 });
      await prisma.groupMember.delete({
        where: { groupId_userId: { groupId: id, userId: memberId } }
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'setRole') {
      await prisma.groupMember.update({
        where: { groupId_userId: { groupId: id, userId: memberId } },
        data: { role }
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'addMember') {
      const idsToAdd = Array.isArray(memberId) ? memberId : [memberId];
      
      if (group.isPremiumOnly) {
        const premiumUsers = await prisma.user.findMany({
          where: { id: { in: idsToAdd }, isPremium: true }
        });
        if (premiumUsers.length !== idsToAdd.length) {
          return NextResponse.json({ error: 'All added members must be Pro users to join a premium-only community.' }, { status: 400 });
        }
      }

      const existingMembers = await prisma.groupMember.findMany({ where: { groupId: id } });
      const existingIds = existingMembers.map(m => m.userId);
      const newIds = idsToAdd.filter((newId: string) => !existingIds.includes(newId));
      if (newIds.length > 0) {
        await prisma.groupMember.createMany({
          data: newIds.map((newId: string) => ({ groupId: id, userId: newId, role: 'MEMBER' }))
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;

    const group = await prisma.groupChat.findUnique({
      where: { id },
      include: { members: true }
    });

    if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const member = group.members.find(m => m.userId === user.id);
    if (!member || member.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    await prisma.groupChat.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Group delete error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
