import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";
import { MediaItem } from "@/components/home/HeroBanner";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursorStr = searchParams.get("cursor");
    const cursor = cursorStr ? parseInt(cursorStr, 10) : 0;
    const limit = 10;
    
    // We fetch a bit more because we need to deduplicate them
    // Assuming worst case there are some duplicates, we fetch 3x the limit
    const fetchLimit = limit * 3; 

    const historyEntries = await prisma.history.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      skip: cursor,
      take: fetchLimit,
    });

    if (!historyEntries.length) {
      return NextResponse.json({ items: [], nextCursor: null });
    }

    // Deduplicate by mediaId
    const seen = new Set();
    const uniqueEntries = historyEntries.filter(entry => {
      if (seen.has(entry.mediaId)) return false;
      seen.add(entry.mediaId);
      return true;
    }).slice(0, limit); // Take exactly the limit amount

    // If we didn't find enough unique entries but there are more rows, the next cursor might be skewed. 
    // For simplicity, we advance the cursor by the number of raw rows we had to scan to get these unique entries.
    // Let's find the index in historyEntries of the last unique entry we took.
    const lastTakenEntry = uniqueEntries[uniqueEntries.length - 1];
    let nextCursor: number | null = null;
    
    if (lastTakenEntry) {
      const lastIndex = historyEntries.findIndex(e => e.id === lastTakenEntry.id);
      // Only return a cursor if we actually pulled rows from the DB and hit our limit (or scanned a full batch)
      if (historyEntries.length === fetchLimit || uniqueEntries.length === limit) {
        nextCursor = cursor + lastIndex + 1;
      }
    }

    const mediaPromises = uniqueEntries.map(entry => 
      tmdb.getMediaDetails(entry.mediaType as 'movie' | 'tv', entry.mediaId)
    );

    const mediaItemsRaw = await Promise.all(mediaPromises);
    const mediaItems = mediaItemsRaw.filter((item): item is MediaItem => item !== null);

    return NextResponse.json({ items: mediaItems, nextCursor });
  } catch (error) {
    console.error("Error fetching history list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
