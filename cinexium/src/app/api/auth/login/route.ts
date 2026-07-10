import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    // Validation
    if (!identifier || !password) {
      return NextResponse.json({ message: 'Username/email and password are required' }, { status: 400 });
    }

    // Find user by email OR username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 401 });
    }

    // Compare password
    const isPasswordMatch = await bcrypt.compare(password, user.password || "");

    if (!isPasswordMatch) {
      return NextResponse.json({ message: 'Invalid Credentials' }, { status: 401 });
    }

    // Cancel account deletion if login again
    if (user.deleteRequested) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          deleteRequested: false,
          deleteAt: null,
        }
      });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: user.id,
      },
      process.env.JWT_SECRET || 'fallback_secret',
      {
        expiresIn: '7d',
      }
    );

    // Response
    return NextResponse.json(
      {
        message: 'Login Successfully',
        token,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

