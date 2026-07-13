import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username || username.trim() === '') {
      return NextResponse.json({ available: false }, { status: 400 });
    }

    const cleanedUsername = username.trim().toLowerCase();

    // Check if exactly taken
    const existingUser = await prisma.user.findUnique({
      where: { username: cleanedUsername }
    });

    if (!existingUser) {
      return NextResponse.json({ available: true });
    }

    // If taken, generate a suggestion by appending a number
    let suggestion = '';
    let isSuggestionAvailable = false;
    let counter = 1;

    // Fast check for up to 5 simple suffixes
    while (!isSuggestionAvailable && counter < 10) {
      const candidate = `${cleanedUsername}${counter}`;
      const check = await prisma.user.findUnique({
        where: { username: candidate }
      });
      if (!check) {
        suggestion = candidate;
        isSuggestionAvailable = true;
      }
      counter++;
    }

    // Fallback if the first few are taken
    if (!isSuggestionAvailable) {
      suggestion = `${cleanedUsername}${Math.floor(Math.random() * 1000)}`;
    }

    return NextResponse.json({ available: false, suggestion });

  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
