import { NextRequest, NextResponse } from 'next/server';
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
  const ext = file.name.split('.').pop();
  const fileName = `${fileId}.${ext}`;
  const filePath = join(UPLOAD_DIR, subDir, fileName);

  await writeFile(filePath, Buffer.from(buffer));

  // Return relative path for public access
  return `/uploads/${subDir}/${fileName}`;
}

export async function GET(request: NextRequest) {
  try {
    const dbService = getDatabaseService();

    // Ensure database tables exist
    const migrationSQL = `
      CREATE TABLE IF NOT EXISTS stories (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        cover_image TEXT,
        author_id TEXT NOT NULL,
        author_name TEXT NOT NULL,
        is_published INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
        FOREIGN KEY (story_id) REFERENCES stories (id) ON DELETE CASCADE
      );
    `;

    dbService.exec(migrationSQL);

    // Get query parameters
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

    // Transform the flat results into structured story objects
    const structuredStories = stories.map(story => {
      const pages = story.page_ids ? story.page_ids.split(',').map((id: string, index: number) => ({
        id: parseInt(id),
        storyId: story.id,
        language: story.page_languages?.split(',')[index] || '',
        pageNumber: parseInt(story.page_numbers?.split(',')[index] || '1'),
        text: story.page_texts?.split(',')[index] || '',
        illustration: story.page_illustrations?.split(',')[index] || ''
      })) : [];

      // Group pages by language
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
        updatedAt: new Date(story.updated_at)
      };
    });

    return NextResponse.json({ stories: structuredStories });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const title = formData.get('title') as string;
    const authorId = formData.get('authorId') as string;
    const authorName = formData.get('authorName') as string;
    const isPublished = formData.get('isPublished') === 'true';
    const contentStr = formData.get('content') as string;

    if (!title || !contentStr || !authorId || !authorName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const content = JSON.parse(contentStr);
    if (!content.indonesian || content.indonesian.length === 0) {
      return NextResponse.json(
        { error: 'Indonesian content is required' },
        { status: 400 }
      );
    }

    const dbService = getDatabaseService();
    const storyId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Handle cover image upload
    let coverImagePath = null;
    const coverImageFile = formData.get('coverImage') as File | null;
    if (coverImageFile && coverImageFile.size > 0) {
      coverImagePath = await handleFileUpload(coverImageFile, 'covers');
    }

    // Insert story
    const insertStoryQuery = `
      INSERT INTO stories (id, title, cover_image, author_id, author_name, is_published, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    dbService.run(insertStoryQuery, [
      storyId,
      title,
      coverImagePath,
      authorId,
      authorName,
      isPublished ? 1 : 0
    ]);

    // Insert pages and handle per-page media files
    const insertPageQuery = `
      INSERT INTO story_pages (story_id, language, page_number, text, illustration)
      VALUES (?, ?, ?, ?, ?)
    `;

    const insertPageAudioQuery = `
      INSERT INTO story_page_audio (story_id, page_number, language, audio_url)
      VALUES (?, ?, ?, ?)
    `;

    const languages = ['indonesian', 'sundanese', 'english'] as const;

    for (const language of languages) {
      const pages = content[language];
      if (!Array.isArray(pages) || pages.length === 0) continue;

      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const page = pages[pageIndex];

        // Handle per-page illustration
        let illustrationPath = null;
        const illustrationKey = `illustration_${language}_${pageIndex}`;
        const illustrationFile = formData.get(illustrationKey) as File | null;

        if (illustrationFile && illustrationFile.size > 0) {
          illustrationPath = await handleFileUpload(illustrationFile, 'illustrations');
        }

        // Insert page
        dbService.run(insertPageQuery, [
          storyId,
          language,
          pageIndex + 1,
          page.text || '',
          illustrationPath
        ]);

        // Handle per-page audio
        const audioKey = `audio_${language}_${pageIndex}`;
        const audioFile = formData.get(audioKey) as File | null;

        if (audioFile && audioFile.size > 0) {
          const audioPath = await handleFileUpload(audioFile, 'audio');

          // Insert into story_page_audio for per-page tracking
          dbService.run(insertPageAudioQuery, [
            storyId,
            pageIndex + 1,
            language,
            audioPath
          ]);
        }
      }
    }

    // Handle legacy full-story audio files if provided (for backward compatibility)
    if (formData.has('audioFiles')) {
      const audioFilesStr = formData.get('audioFiles') as string;
      try {
        const audioFiles = JSON.parse(audioFilesStr);
        const insertAudioQuery = `
          INSERT INTO story_audio_files (story_id, language, audio_url)
          VALUES (?, ?, ?)
        `;

        Object.entries(audioFiles).forEach(([language, url]: [string, any]) => {
          if (url && typeof url === 'string') {
            dbService.run(insertAudioQuery, [storyId, language, url]);
          }
        });
      } catch (e) {
        console.warn('Could not parse audioFiles:', e);
      }
    }

    // Handle legacy illustrations if provided (for backward compatibility)
    if (formData.has('illustrations')) {
      const illustrationsStr = formData.get('illustrations') as string;
      try {
        const illustrations = JSON.parse(illustrationsStr);
        const insertIllustrationQuery = `
          INSERT INTO story_illustrations (story_id, illustration_url, order_index)
          VALUES (?, ?, ?)
        `;

        if (Array.isArray(illustrations)) {
          illustrations.forEach((url: string, index: number) => {
            if (url) {
              dbService.run(insertIllustrationQuery, [storyId, url, index]);
            }
          });
        }
      } catch (e) {
        console.warn('Could not parse illustrations:', e);
      }
    }

    return NextResponse.json({
      success: true,
      storyId,
      message: 'Story created successfully with all files'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating story:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid content format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}