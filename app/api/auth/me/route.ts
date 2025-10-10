import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/lib/db-service';

export async function GET(request: NextRequest) {
  try {
    // In a real app, you'd verify JWT token from cookies/headers
    // For demo purposes, we'll check for a session cookie
    const sessionEmail = request.cookies.get('user-session')?.value;

    if (!sessionEmail) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const dbService = getDatabaseService();
    const user = await dbService.findUserByEmail(sessionEmail);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
