// app/api/admin/modules/route.ts - UPDATED dengan imgcdn.dev CDN
// Catatan: modules hanya menyimpan file PPT/PDF (bukan gambar), jadi tetap lokal
// Hanya cover image yang di-upload ke CDN bila ada
import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/lib/db-service';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'public/uploads';

async function checkAdminAuth(request: NextRequest): Promise<{ isValid: boolean; userId?: string }> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const cookieHeader = request.headers.get('cookie') || '';
    
    const response = await fetch(`${baseUrl}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
      },
    });

    if (!response.ok) {
      return { isValid: false };
    }

    const data = await response.json();
    const user = data.user;
    if (!user || user.role !== 'admin') {
      return { isValid: false };
    }

    return { isValid: true, userId: user.id };
  } catch (error) {
    return { isValid: false };
  }
}

async function ensureUploadDir(subDir: string) {
  const dirPath = join(UPLOAD_DIR, subDir);
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

function generateFileId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// File PPT/PDF tetap lokal karena imgcdn.dev hanya support gambar
async function handleFileUpload(file: File, subDir: string): Promise<string> {
  await ensureUploadDir(subDir);

  const buffer = await file.arrayBuffer();
  const fileId = generateFileId();
  const ext = file.name.split('.').pop() || 'bin';
  const fileName = `${fileId}.${ext}`;
  const filePath = join(UPLOAD_DIR, subDir, fileName);

  await writeFile(filePath, Buffer.from(buffer));

  return `/uploads/${subDir}/${fileName}`;
}

export async function GET(request: NextRequest) {
  try {
    const dbService = getDatabaseService();

    const migrationSQL = `
      CREATE TABLE IF NOT EXISTS modules (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT,
        file_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    dbService.exec(migrationSQL);

    const query = `
      SELECT * FROM modules
      ORDER BY created_at DESC
    `;

    const modules = dbService.all(query) as any[];

    const structuredModules = modules.map(module => ({
      id: module.id,
      title: module.title,
      description: module.description,
      type: module.type,
      content: module.content,
      fileUrl: module.file_url,
      createdAt: new Date(module.created_at),
      updatedAt: new Date(module.updated_at)
    }));

    return NextResponse.json({ modules: structuredModules });
  } catch (error) {
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

    const formData = await request.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as string;
    const content = formData.get('content') as string;

    if (!title || !description || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (type === 'blog' && !content) {
      return NextResponse.json(
        { error: 'Content is required for blog modules' },
        { status: 400 }
      );
    }

    if ((type === 'ppt' || type === 'pdf') && !formData.has('file')) {
      return NextResponse.json(
        { error: 'File is required for this module type' },
        { status: 400 }
      );
    }

    const dbService = getDatabaseService();
    const moduleId = `module_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // PPT/PDF file tetap lokal (bukan gambar)
    let fileUrl = null;
    if (type === 'ppt' || type === 'pdf') {
      const file = formData.get('file') as File;
      if (file && file.size > 0) {
        try {
          fileUrl = await handleFileUpload(file, 'modules');
        } catch (error) {
          return NextResponse.json(
            { error: 'Failed to upload file: ' + (error instanceof Error ? error.message : 'Unknown error') },
            { status: 400 }
          );
        }
      }
    }

    const insertModuleQuery = `
      INSERT INTO modules (id, title, description, type, content, file_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    try {
      dbService.run(insertModuleQuery, [
        moduleId,
        title,
        description,
        type,
        type === 'blog' ? content : '',
        fileUrl
      ]);
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to create module: ' + (error instanceof Error ? error.message : 'Unknown error') },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      moduleId,
      message: 'Module created successfully'
    }, { status: 201 });

  } catch (error) {
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

    const formData = await request.formData();

    const id = formData.get('id') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as string;
    const content = formData.get('content') as string;

    if (!id || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const dbService = getDatabaseService();

    let fileUrl = null;
    if ((type === 'ppt' || type === 'pdf') && formData.has('file')) {
      const file = formData.get('file') as File;
      if (file && file.size > 0) {
        try {
          fileUrl = await handleFileUpload(file, 'modules');
        } catch (error) {
          return NextResponse.json(
            { error: 'Failed to upload file: ' + (error instanceof Error ? error.message : 'Unknown error') },
            { status: 400 }
          );
        }
      }
    }

    const updateModuleQuery = fileUrl
      ? `UPDATE modules SET title = ?, description = ?, type = ?, content = ?, file_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      : `UPDATE modules SET title = ?, description = ?, type = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    const params = fileUrl
      ? [title, description, type, type === 'blog' ? content : '', fileUrl, id]
      : [title, description, type, type === 'blog' ? content : '', id];

    try {
      dbService.run(updateModuleQuery, params);
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to update module: ' + (error instanceof Error ? error.message : 'Unknown error') },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      moduleId: id,
      message: 'Module updated successfully'
    });

  } catch (error) {
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
        { error: 'Module ID is required' },
        { status: 400 }
      );
    }

    const dbService = getDatabaseService();

    try {
      dbService.run('DELETE FROM modules WHERE id = ?', [id]);
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to delete module: ' + (error instanceof Error ? error.message : 'Unknown error') },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Module deleted successfully'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}