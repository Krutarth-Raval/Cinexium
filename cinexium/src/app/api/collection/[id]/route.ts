import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import cloudinary from '@/lib/cloudinary';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const collection = await prisma.collection.findUnique({
      where: { id }
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    if (collection.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const isPublic = formData.get('isPublic') === 'true';
    const thumbnailFile = formData.get('thumbnail') as File | null;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check unique constraint per user if name changed
    if (name !== collection.name) {
      const existing = await prisma.collection.findUnique({
        where: {
          userId_name: {
            userId: user.id,
            name: name
          }
        }
      });
      if (existing) {
        return NextResponse.json({ error: 'You already have a collection with this name' }, { status: 400 });
      }
    }

    let thumbnailUrl = collection.thumbnail;

    if (thumbnailFile && thumbnailFile.size > 0) {
      const buffer = Buffer.from(await thumbnailFile.arrayBuffer());
      
      const uploadResult: any = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'cinexium/collections' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });
      
      thumbnailUrl = uploadResult.secure_url;
    }

    const updatedCollection = await prisma.collection.update({
      where: { id },
      data: {
        name,
        description: description || '',
        isPublic,
        thumbnail: thumbnailUrl
      }
    });

    return NextResponse.json({ success: true, collection: updatedCollection });
  } catch (error: any) {
    console.error('Error updating collection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
