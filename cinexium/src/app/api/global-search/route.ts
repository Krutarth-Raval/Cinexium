import { NextResponse } from 'next/server';
import { tmdb } from '@/lib/tmdb';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  
  if (!q) {
    return NextResponse.json({ movies: [], series: [], users: [], collections: [], groupChats: [] });
  }

  try {
    const [movies, series, users, collections, groupChats] = await Promise.all([
      tmdb.searchMedia(q, 'movie'),
      tmdb.searchMedia(q, 'tv'),
      prisma.user.findMany({
        where: { 
          OR: [
            { name: { contains: q, mode: 'insensitive' } }, 
            { username: { contains: q, mode: 'insensitive' } }
          ] 
        },
        take: 20,
        select: { id: true, name: true, username: true, avatar: true }
      }),
      prisma.collection.findMany({
        where: { name: { contains: q, mode: 'insensitive' }, isPublic: true },
        take: 20,
        include: { user: { select: { username: true } }, items: { take: 4 } }
      }),
      prisma.groupChat.findMany({
        where: { name: { contains: q, mode: 'insensitive' }, isPublic: true },
        take: 20,
        include: { owner: { select: { username: true } } }
      })
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
        url: `/profile/${u.username}`
      })),
      collections: collections.map(c => ({ 
        id: c.id, 
        title: c.name, 
        description: `By @${c.user.username} • ${c.items.length} items`, 
        posterUrl: '', // Could generate a collage or use a placeholder
        type: 'collection',
        url: `/collection/${c.id}`
      })),
      groupChats: groupChats.map(g => ({ 
        id: g.id, 
        title: g.name, 
        description: `By @${g.owner.username}`, 
        posterUrl: '', // Could use a placeholder
        type: 'group',
        url: `/chat/${g.id}`
      }))
    });
  } catch (error) {
    console.error('Global search API error:', error);
    // If Prisma is outdated in dev, return empty arrays to avoid crash
    return NextResponse.json({ 
      movies: await tmdb.searchMedia(q, 'movie'), 
      series: await tmdb.searchMedia(q, 'tv'), 
      users: [], 
      collections: [], 
      groupChats: [] 
    });
  }
}
