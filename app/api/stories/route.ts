// app/api/stories/route.ts - UPDATED dengan imgcdn.dev CDN
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getDatabaseService } from '@/lib/db-service';
import { uploadImageToCDN } from '@/lib/imgcdn-service';

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

    // Upload cover image ke imgcdn.dev
    let coverImageUrl = null;
    const coverImageFile = formData.get('coverImage') as File | null;
    if (coverImageFile && coverImageFile.size > 0) {
      try {
        const cdnResult = await uploadImageToCDN(coverImageFile);
        coverImageUrl = cdnResult.url;
        console.log('Cover image uploaded to CDN:', coverImageUrl);
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to upload cover image to CDN: ' + (error instanceof Error ? error.message : 'Unknown error') },
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
        coverImageUrl,
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

    // Track illustrations yang sudah di-upload (shared per page)
    const handledIllustrations = new Set<number>();
    const illusts: Record<number, string> = {};

    for (const language of languages) {
      const pages = content[language];
      if (!Array.isArray(pages) || pages.length === 0) {
        continue;
      }

      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const page = pages[pageIndex];

        // Upload ilustrasi (hanya sekali, untuk bahasa Indonesian)
        let illustrationUrl = null;
        if (!handledIllustrations.has(pageIndex) && language === 'indonesian') {
          const illustrationKey = `illustration_${pageIndex}`;
          const illustrationFile = formData.get(illustrationKey) as File | null;

          if (illustrationFile && illustrationFile.size > 0) {
            try {
              const cdnResult = await uploadImageToCDN(illustrationFile);
              illustrationUrl = cdnResult.url;
              handledIllustrations.add(pageIndex);
              illusts[pageIndex] = illustrationUrl;
              console.log(`Illustration page ${pageIndex} uploaded to CDN:`, illustrationUrl);
            } catch (error) {
              return NextResponse.json(
                { error: `Failed to upload illustration for page ${pageIndex + 1} to CDN: ${error instanceof Error ? error.message : 'Unknown error'}` },
                { status: 400 }
              );
            }
          }
        } else if (handledIllustrations.has(pageIndex) && language !== 'indonesian') {
          if (illusts[pageIndex]) {
            illustrationUrl = illusts[pageIndex];
          }
        }

        try {
          dbService.run(insertPageQuery, [
            storyId,
            language,
            pageIndex + 1,
            page.text || '',
            illustrationUrl
          ]);
        } catch (error) {
          return NextResponse.json(
            { error: `Failed to save ${language} page ${pageIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
          );
        }

        // Handle per-language audio (simpan lokal karena audio tidak didukung imgcdn)
        const audioKey = `audio_${language}_${pageIndex}`;
        const audioFile = formData.get(audioKey) as File | null;

        if (audioFile && audioFile.size > 0) {
          // Audio tetap disimpan lokal
          const { writeFile, mkdir } = await import('fs/promises');
          const { join } = await import('path');
          const { existsSync } = await import('fs');

          const UPLOAD_DIR = process.env.UPLOAD_DIR || 'public/uploads';
          const audioDirPath = join(UPLOAD_DIR, 'audio');
          if (!existsSync(audioDirPath)) {
            await mkdir(audioDirPath, { recursive: true });
          }

          const buffer = await audioFile.arrayBuffer();
          const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const ext = audioFile.name.split('.').pop() || 'mp3';
          const fileName = `${fileId}.${ext}`;
          const filePath = join(UPLOAD_DIR, 'audio', fileName);
          await writeFile(filePath, Buffer.from(buffer));
          const audioPath = `/uploads/audio/${fileName}`;

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
        }
      }
    }

    // Clear cache
    try {
      revalidatePath('/dashboard');
      revalidatePath('/stories');
      revalidatePath(`/stories/${storyId}`);
      revalidatePath(`/api/stories`);
    } catch (error) {
      console.error('Cache revalidation error:', error);
    }

    return NextResponse.json({
      success: true,
      storyId,
      message: 'Story created successfully with CDN images'
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}