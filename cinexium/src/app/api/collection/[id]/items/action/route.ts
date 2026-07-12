import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: collectionId } = await params;
    const body = await req.json();
    const { action, itemIds } = body; // action: 'pin', 'unpin', 'remove'

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: "No items selected" }, { status: 400 });
    }

    // Verify ownership
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      select: { userId: true },
    });

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    if (collection.userId !== userId) {
      return NextResponse.json({ error: "Forbidden: You do not own this collection" }, { status: 403 });
    }

    if (action === 'remove') {
      await prisma.collectionItem.deleteMany({
        where: {
          collectionId,
          id: { in: itemIds }
        }
      });
    } else if (action === 'pin' || action === 'unpin') {
      await prisma.collectionItem.updateMany({
        where: {
          collectionId,
          id: { in: itemIds }
        },
        data: {
          pinnedAt: action === 'pin' ? new Date() : null,
        }
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error modifying collection items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
