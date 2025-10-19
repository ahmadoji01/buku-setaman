import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/lib/db-service';

const ADMIN_CHECK_TIMEOUT = 5000;

async function checkAdminAuth(request: NextRequest): Promise<{ isValid: boolean; userId?: string }> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const cookieHeader = request.headers.get('cookie') || '';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ADMIN_CHECK_TIMEOUT);
    
    const response = await fetch(`${baseUrl}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log('Auth check failed with status:', response.status);
      return { isValid: false };
    }

    const data = await response.json();
    const user = data.user;
    
    if (!user || user.role !== 'admin') {
      console.log('User role is not admin:', user?.role);
      return { isValid: false };
    }

    console.log('Auth check passed for user:', user.id);
    return { isValid: true, userId: user.id };
  } catch (error) {
    console.error('Auth check error:', error);
    return { isValid: false };
  }
}

export async function GET(request: NextRequest) {
  try {
    const dbService = getDatabaseService();

    const migrationSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    dbService.exec(migrationSQL);

    const query = `
      SELECT id, name, email, role, created_at, updated_at FROM users
      ORDER BY created_at DESC
    `;

    const users = dbService.all(query) as any[];
    console.log('Fetched users from DB:', users.length);

    const structuredUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at)
    }));

    return NextResponse.json({ users: structuredUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await checkAdminAuth(request);

    if (!auth.isValid) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const dbService = getDatabaseService();
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const insertUserQuery = `
      INSERT INTO users (id, name, email, password, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    try {
      dbService.run(insertUserQuery, [userId, name, email, password, role]);
      console.log('User created:', userId);
    } catch (error) {
      console.error('User insert error:', error);
      if (error instanceof Error && error.message.includes('UNIQUE')) {
        return NextResponse.json(
          { error: 'Email sudah terdaftar' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to create user: ' + (error instanceof Error ? error.message : 'Unknown error') },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      userId,
      message: 'User created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await checkAdminAuth(request);

    if (!auth.isValid) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, name, email, role } = body;

    if (!id || !name || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const dbService = getDatabaseService();

    const updateUserQuery = `
      UPDATE users SET name = ?, email = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `;

    try {
      dbService.run(updateUserQuery, [name, email, role, id]);
      console.log('User updated:', id);
    } catch (error) {
      console.error('User update error:', error);
      if (error instanceof Error && error.message.includes('UNIQUE')) {
        return NextResponse.json(
          { error: 'Email sudah digunakan' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to update user: ' + (error instanceof Error ? error.message : 'Unknown error') },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      userId: id,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await checkAdminAuth(request);

    if (!auth.isValid) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const dbService = getDatabaseService();

    try {
      dbService.run('DELETE FROM users WHERE id = ?', [id]);
      console.log('User deleted:', id);
    } catch (error) {
      console.error('User delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete user: ' + (error instanceof Error ? error.message : 'Unknown error') },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}