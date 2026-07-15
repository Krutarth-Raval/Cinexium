import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { tmdb } from '@/lib/tmdb';
import { prisma } from '@/lib/prisma';
import { applyRateLimit, getClientIp, normalizeText } from '@/lib/security';

export async function GET(req: Request) {
  const rateLimit = applyRateLimit({
    key: `global-search:${getClientIp(req)}`,
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many search requests' }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  let q = normalizeText(searchParams.get('q'), 100);
  
  if (!q) {
    return NextResponse.json({ movies: [], series: [], users: [], collections: [], groupChats: [] });
  }

  let filter = 'all';
  if (q.toUpperCase().startsWith('M-')) { filter = 'movie'; q = q.substring(2); }
  else if (q.toUpperCase().startsWith('TV-')) { filter = 'tv'; q = q.substring(3); }
  else if (q.startsWith('@')) { filter = 'user'; q = q.substring(1); }
  else if (q.startsWith('#')) { filter = 'community'; q = q.substring(1); }
  else if (q.toUpperCase().startsWith('C-')) { filter = 'collection'; q = q.substring(2); }

  if (!q.trim()) {
    return NextResponse.json({ movies: [], series: [], users: [], collections: [], groupChats: [] });
  }

  try {
    const session = await getServerSession(authOptions);
    let currentUser = null;
    if (session?.user?.email) {
      currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    }

    const [movies, series, users, collections, groupChats] = await Promise.all([
      (filter === 'all' || filter === 'movie') ? tmdb.searchMedia(q, 'movie') : Promise.resolve([]),
      (filter === 'all' || filter === 'tv') ? tmdb.searchMedia(q, 'tv') : Promise.resolve([]),
      (filter === 'all' || filter === 'user') ? prisma.user.findMany({
        where: { 
          OR: [
            { name: { contains: q, mode: 'insensitive' } }, 
            { username: { contains: q, mode: 'insensitive' } }
          ],
          ...(currentUser ? {
            AND: [
              { blockedBy: { none: { blockerId: currentUser.id } } },
              { blocking: { none: { blockedId: currentUser.id } } }
            ]
          } : {})
        },
        take: 20,
        select: { id: true, name: true, username: true, avatar: true, isPremium: true }
      }) : Promise.resolve([]),
      (filter === 'all' || filter === 'collection') ? prisma.collection.findMany({
        where: { 
          name: { contains: q, mode: 'insensitive' }, 
          isPublic: true,
          user: { isPrivate: false } 
        },
        take: 20,
        include: { user: { select: { username: true } }, items: { take: 4 } }
      }) : Promise.resolve([]),
      (filter === 'all' || filter === 'community') ? prisma.groupChat.findMany({
        where: { name: { contains: q, mode: 'insensitive' }, isCommunity: true },
        take: 20,
        include: { owner: { select: { username: true } } }
      }) : Promise.resolve([])
    ]);

    return NextResponse.json({
      movies,
      series,
      users: users.map(u => ({ 
        id: u.id, 
        title: u.name || u.username, 
        description: `@${u.username}`, 
        posterUrl: u.avatar || '', 
        type: 'user',
        url: `/profile/${u.username}`,
        isPremium: u.isPremium,
        username: u.username
      })),
      collections: collections.map(c => ({ 
        id: c.id, 
        title: c.name, 
        description: `By @${c.user.username} • ${c.items.length} items`, 
        posterUrl: '', 
        type: 'collection',
        url: `/collection/${c.id}`
      })),
      groupChats: groupChats.map(g => ({ 
        id: g.id, 
        title: g.name, 
        description: `By @${g.owner.username}`, 
        posterUrl: '', 
        type: 'group',
        url: `/chat/group/${g.id}` // Fixed 404 URL here
      }))
    });
  } catch (error) {
    console.error('Global search API error:', error);
    return NextResponse.json({ 
      movies: (filter === 'all' || filter === 'movie') ? await tmdb.searchMedia(q, 'movie') : [], 
      series: (filter === 'all' || filter === 'tv') ? await tmdb.searchMedia(q, 'tv') : [], 
      users: [], 
      collections: [], 
      groupChats: [] 
    });
  }
}
