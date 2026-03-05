// app/api/stories/route.ts - UPDATED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getDatabaseService } from '@/lib/db-service';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'public/uploads';

async function ensureUploadDir(subDir: string) {
  const dirPath = join(UPLOAD_DIR, subDir);
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

function generateFileId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

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
      CREATE TABLE IF NOT EXISTS stories (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        cover_image TEXT,
        author_id TEXT NOT NULL,
        author_name TEXT NOT NULL,
        is_published INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        gemini_source_url TEXT,
        gemini_embed_url TEXT,
        gemini_id TEXT
      );

      CREATE TABLE IF NOT EXISTS story_pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        story_id TEXT NOT NULL,
        language TEXT NOT NULL,
        page_number INTEGER NOT NULL,
        text TEXT NOT NULL,
        illustration TEXT,
        FOREIGN KEY (story_id) REFERENCES stories (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS story_illustrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        story_id TEXT NOT NULL,
        illustration_url TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        FOREIGN KEY (story_id) REFERENCES stories (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS story_audio_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        story_id TEXT NOT NULL,
        language TEXT NOT NULL,
        audio_url TEXT NOT NULL,
        FOREIGN KEY (story_id) REFERENCES stories (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS story_page_audio (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        story_id TEXT NOT NULL,
        page_number INTEGER NOT NULL,
        language TEXT NOT NULL,
        audio_url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (story_id) REFERENCES stories (id) ON DELETE CASCADE
      );
    `;

    dbService.exec(migrationSQL);

    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get('authorId');
    const published = searchParams.get('published');

    let query = `
      SELECT s.*, u.name as author_name,
             GROUP_CONCAT(sp.id) as page_ids,
             GROUP_CONCAT(sp.language) as page_languages,
             GROUP_CONCAT(sp.page_number) as page_numbers,
             GROUP_CONCAT(sp.text) as page_texts,
             GROUP_CONCAT(sp.illustration) as page_illustrations
      FROM stories s
      LEFT JOIN users u ON s.author_id = u.id
      LEFT JOIN story_pages sp ON s.id = sp.story_id
    `;

    const params: (string | number)[] = [];
    const conditions: string[] = [];

    if (authorId) {
      conditions.push('s.author_id = ?');
      params.push(authorId);
    }

    if (published !== null) {
      const publishedBool = published === "true" ? 1 : published === "false" ? 0 : parseInt(published);
      conditions.push('s.is_published = ?');
      params.push(publishedBool);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY s.id ORDER BY s.created_at DESC';

    const stories = dbService.all(query, params) as any[];

    const structuredStories = stories.map(story => {
      const pages = story.page_ids ? story.page_ids.split(',').map((id: string, index: number) => ({
        id: parseInt(id),
        storyId: story.id,
        language: story.page_languages?.split(',')[index] || '',
        pageNumber: parseInt(story.page_numbers?.split(',')[index] || '1'),
        text: story.page_texts?.split(',')[index] || '',
        illustration: story.page_illustrations?.split(',')[index] || ''
      })) : [];

      const content: any = {};
      pages.forEach((page: any) => {
        if (!content[page.language]) {
          content[page.language] = [];
        }
        content[page.language].push({
          pageNumber: page.pageNumber,
          text: page.text,
          illustration: page.illustration
        });
      });

      return {
        id: story.id,
        title: story.title,
        coverImage: story.cover_image,
        content,
        authorId: story.author_id,
        authorName: story.author_name,
        isPublished: Boolean(story.is_published),
        createdAt: new Date(story.created_at),
        updatedAt: new Date(story.updated_at),
        gemini_source_url: story.gemini_source_url || null
      };
    });

    return NextResponse.json({ stories: structuredStories });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const title = formData.get('title') as string;
    const authorId = formData.get('authorId') as string;
    const authorName = formData.get('authorName') as string;
    const isPublished = formData.get('isPublished') === 'true';
    const geminiSourceUrl = formData.get('geminiSourceUrl') as string || null;
    const contentStr = formData.get('content') as string;

    if (!title || !contentStr || !authorId || !authorName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let content;
    try {
      content = JSON.parse(contentStr);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid content format: ' + (e instanceof Error ? e.message : 'Unknown error') },
        { status: 400 }
      );
    }

    if (!content.indonesian || content.indonesian.length === 0) {
      return NextResponse.json(
        { error: 'Indonesian content is required' },
        { status: 400 }
      );
    }

    const dbService = getDatabaseService();
    const storyId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let coverImagePath = null;
    const coverImageFile = formData.get('coverImage') as File | null;
    if (coverImageFile && coverImageFile.size > 0) {
      try {
        coverImagePath = await handleFileUpload(coverImageFile, 'covers');
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to upload cover image: ' + (error instanceof Error ? error.message : 'Unknown error') },
          { status: 400 }
        );
      }
    }

    const insertStoryQuery = `
      INSERT INTO stories (
        id, 
        title, 
        cover_image, 
        author_id, 
        author_name, 
        is_published,
        gemini_source_url,
        created_at, 
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    try {
      dbService.run(insertStoryQuery, [
        storyId,
        title,
        coverImagePath,
        authorId,
        authorName,
        isPublished ? 1 : 0,
        geminiSourceUrl
      ]);
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to create story: ' + (error instanceof Error ? error.message : 'Unknown error') },
        { status: 500 }
      );
    }

    const insertPageQuery = `
      INSERT INTO story_pages (story_id, language, page_number, text, illustration)
      VALUES (?, ?, ?, ?, ?)
    `;

    const insertPageAudioQuery = `
      INSERT INTO story_page_audio (story_id, page_number, language, audio_url)
      VALUES (?, ?, ?, ?)
    `;

    const languages = ['indonesian', 'sundanese', 'english'] as const;

    // Track which illustrations we've already handled
    const handledIllustrations = new Set<number>();
    const illusts:Record<number, string> = {};

    for (const language of languages) {
      const pages = content[language];
      if (!Array.isArray(pages) || pages.length === 0) {
        continue;
      }

      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const page = pages[pageIndex];

        // Shared illustration (only upload once, for indonesian)
        let illustrationPath = null;
        if (!handledIllustrations.has(pageIndex) && language === 'indonesian') {
          const illustrationKey = `illustration_${pageIndex}`;
          const illustrationFile = formData.get(illustrationKey) as File | null;

          if (illustrationFile && illustrationFile.size > 0) {
            try {
              illustrationPath = await handleFileUpload(illustrationFile, 'illustrations');
              handledIllustrations.add(pageIndex);
              illusts[pageIndex] = illustrationPath;
            } catch (error) {
              return NextResponse.json(
                { error: `Failed to upload illustration for page ${pageIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}` },
                { status: 400 }
              );
            }
          }
        } else if (handledIllustrations.has(pageIndex) && language !== 'indonesian') {
          if (illusts[pageIndex]) {
            illustrationPath = illusts[pageIndex];
          }
        }

        try {
          dbService.run(insertPageQuery, [
            storyId,
            language,
            pageIndex + 1,
            page.text || '',
            illustrationPath
          ]);
        } catch (error) {
          return NextResponse.json(
            { error: `Failed to save ${language} page ${pageIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
          );
        }

        // Handle per-language audio
        const audioKey = `audio_${language}_${pageIndex}`;
        const audioFile = formData.get(audioKey) as File | null;

        if (audioFile && audioFile.size > 0) {
          try {
            const audioPath = await handleFileUpload(audioFile, 'audio');
            try {
              dbService.run(insertPageAudioQuery, [
                storyId,
                pageIndex + 1,
                language,
                audioPath
              ]);
            } catch (error) {
              return NextResponse.json(
                { error: `Failed to save audio for ${language} page ${pageIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}` },
                { status: 500 }
              );
            }
          } catch (error) {
            return NextResponse.json(
              { error: `Failed to upload audio for ${language} page ${pageIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}` },
              { status: 400 }
            );
          }
        }
      }
    }

    // Clear cache after successful upload
    try {
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/create');
      revalidatePath('/stories');
      revalidatePath(`/stories/${storyId}`);
      revalidatePath(`/api/stories`);
      revalidatePath(`/api/stories/${storyId}`);
    } catch (error) {
      console.error('Cache revalidation error:', error);
    }

    return NextResponse.json({
      success: true,
      storyId,
      message: 'Story created successfully with all files'
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}