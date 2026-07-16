import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { enforceSameOrigin, MAX_GROUP_NAME_LENGTH, normalizeText } from '@/lib/security';
import { fetchGifDimensionsByIds } from '@/lib/giphy-server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const before = url.searchParams.get('before');
    const limitParam = Number(url.searchParams.get('limit') || '50');
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 50;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as { id: string };

    const group = await prisma.groupChat.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, name: true, avatar: true, isPremium: true } } },
          orderBy: { role: 'asc' }
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

    if (!isMember) {
      return NextResponse.json({
        id: group.id,
        name: group.name,
        avatar: group.avatar,
        isCommunity: group.isCommunity,
        isPublic: group.isPublic,
        isPremiumOnly: group.isPremiumOnly,
        members: [],
        messages: [],
        hasMore: false,
        isMember: false,
      });
    }

    const fetchedMessages = await prisma.groupMessage.findMany({
      where: { groupId: id },
      include: {
        sender: { select: { id: true, username: true, name: true, avatar: true, isPremium: true } },
        reactions: { include: { user: { select: { id: true, name: true, username: true, avatar: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(before ? { cursor: { id: before }, skip: 1 } : {})
    });

    const hasMore = fetchedMessages.length > limit;
    const maskedMessages = fetchedMessages
      .slice(0, limit)
      .map(msg => ({
        ...msg,
        sender: {
          ...msg.sender,
          isBlocked: blockedUserIds.has(msg.sender.id)
        }
      }))
      .reverse();
    const gifDimensionsById = await fetchGifDimensionsByIds(
      maskedMessages.map((message) => message.gifId || '').filter(Boolean)
    );
    const maskedMessagesWithGifDimensions = maskedMessages.map((message) => ({
      ...message,
      gifWidth: message.gifId ? gifDimensionsById[message.gifId]?.width ?? null : null,
      gifHeight: message.gifId ? gifDimensionsById[message.gifId]?.height ?? null : null,
    }));

    return NextResponse.json({ ...group, members: maskedMembers, messages: maskedMessagesWithGifDimensions, hasMore, isMember: true });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const originError = enforceSameOrigin(req);
    if (originError) return originError;

    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as { id: string };

    const body = await req.json();
    const action = normalizeText(body.action, 32);
    const name = normalizeText(body.name, MAX_GROUP_NAME_LENGTH);
    const memberId = body.memberId;
    const role = normalizeText(body.role, 16);

    const group = await prisma.groupChat.findUnique({
      where: { id },
      include: { members: true }
    });

    if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const member = group.members.find(m => m.userId === user.id);

    // Allow users to join if they use the 'join' action
    if (action === 'join') {
      if (member) return NextResponse.json({ error: 'Already a member' }, { status: 400 });
      
      const inviteCode = normalizeText(body.inviteCode, 64);
      
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
      if (!name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      }
      const updated = await prisma.groupChat.update({
        where: { id },
        data: { name }
      });
      return NextResponse.json(updated);
    } 
    
    if (action === 'updateMessagePermission') {
      const messagePermission = normalizeText(body.messagePermission, 16);
      if (!['ALL', 'ADMIN_ONLY', 'PREMIUM_ONLY'].includes(messagePermission)) {
        return NextResponse.json({ error: 'Invalid message permission' }, { status: 400 });
      }
      const updated = await prisma.groupChat.update({
        where: { id },
        data: { messagePermission }
      });
      return NextResponse.json(updated);
    }

    if (action === 'removeMember') {
      if (typeof memberId !== 'string' || !memberId) {
        return NextResponse.json({ error: 'Invalid member' }, { status: 400 });
      }
      if (memberId === user.id) return NextResponse.json({ error: 'Cannot remove self' }, { status: 400 });
      await prisma.groupMember.delete({
        where: { groupId_userId: { groupId: id, userId: memberId } }
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'setRole') {
      if (typeof memberId !== 'string' || !memberId || !['ADMIN', 'MEMBER'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role update' }, { status: 400 });
      }
      await prisma.groupMember.update({
        where: { groupId_userId: { groupId: id, userId: memberId } },
        data: { role }
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'addMember') {
      const idsToAdd = Array.isArray(memberId) ? memberId : [memberId];
      const normalizedIds = idsToAdd.filter((newId: unknown): newId is string => typeof newId === 'string' && newId.length <= 64);
      if (normalizedIds.length === 0) {
        return NextResponse.json({ error: 'No valid members provided' }, { status: 400 });
      }
      
      if (group.isPremiumOnly) {
        const premiumUsers = await prisma.user.findMany({
          where: { id: { in: normalizedIds }, isPremium: true }
        });
        if (premiumUsers.length !== normalizedIds.length) {
          return NextResponse.json({ error: 'All added members must be Pro users to join a premium-only community.' }, { status: 400 });
        }
      }

      const existingMembers = await prisma.groupMember.findMany({ where: { groupId: id } });
      const existingIds = existingMembers.map(m => m.userId);
      const newIds = normalizedIds.filter((newId: string) => !existingIds.includes(newId));
      if (newIds.length > 0) {
        await prisma.groupMember.createMany({
          data: newIds.map((newId: string) => ({ groupId: id, userId: newId, role: 'MEMBER' }))
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const originError = enforceSameOrigin(req);
    if (originError) return originError;

    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as { id: string };

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
