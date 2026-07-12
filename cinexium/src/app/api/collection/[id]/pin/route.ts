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
    const { action } = body; // "pin" or "unpin"

    const collectionLike = await prisma.collectionLike.findUnique({
      where: {
        userId_collectionId: {
          userId,
          collectionId,
        },
      },
    });

    if (!collectionLike) {
      return NextResponse.json({ error: "Collection not found in liked collections" }, { status: 404 });
    }

    await prisma.collectionLike.update({
      where: {
        userId_collectionId: {
          userId,
          collectionId,
        },
      },
      data: {
        pinnedAt: action === 'pin' ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error pinning collection:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
