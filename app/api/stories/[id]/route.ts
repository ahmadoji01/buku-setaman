// app/api/stories/[id]/route.ts - UPDATED dengan imgcdn.dev CDN
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getDatabaseService } from '@/lib/db-service';
import { uploadImageToCDN } from '@/lib/imgcdn-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const storyId = params.id;

    const storyQuery = `
      SELECT s.*, u.name as author_name
      FROM stories s
      LEFT JOIN users u ON s.author_id = u.id
      WHERE s.id = ?
    `;

    const story = dbService.get(storyQuery, [storyId]) as any;

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    const pagesQuery = `
      SELECT sp.*, spa.audio_url as page_audio_url
      FROM story_pages sp
      LEFT JOIN story_page_audio spa ON sp.story_id = spa.story_id AND sp.page_number = spa.page_number AND sp.language = spa.language
      WHERE sp.story_id = ?
      ORDER BY sp.language, sp.page_number
    `;

    const pages = dbService.all(pagesQuery, [storyId]) as any[];

    const content: any = {};
    const audioFilesByLanguage: Record<string, string> = {};
    
    pages.forEach((page: any) => {
      if (!content[page.language]) {
        content[page.language] = [];
      }
      
      const pageObject: any = {
        pageNumber: page.page_number,
        text: page.text,
        illustration: page.illustration,
        audio: page.page_audio_url || null,
      };
      
      content[page.language].push(pageObject);
      
      if (page.page_audio_url && !audioFilesByLanguage[page.language]) {
        audioFilesByLanguage[page.language] = page.page_audio_url;
      }
    });

    const illustrationsQuery = `
      SELECT illustration_url FROM story_illustrations WHERE story_id = ? ORDER BY order_index
    `;

    const illustrations = dbService.all(illustrationsQuery, [storyId]) as any[];
    const illustrationUrls = illustrations.map((ill: any) => ill.illustration_url);

    const audioQuery = `
      SELECT language, audio_url FROM story_audio_files WHERE story_id = ?
    `;

    const audioFilesResult = dbService.all(audioQuery, [storyId]) as any[];
    const audioFiles: Record<string, string> = {};
    audioFilesResult.forEach((audio: any) => {
      audioFiles[audio.language] = audio.audio_url;
    });
    
    Object.entries(audioFilesByLanguage).forEach(([language, url]) => {
      if (!audioFiles[language]) {
        audioFiles[language] = url;
      }
    });

    const structuredStory = {
      id: story.id,
      title: story.title,
      coverImage: story.cover_image,
      content,
      authorId: story.author_id,
      authorName: story.author_name,
      illustrations: illustrationUrls,
      audioFiles,
      isPublished: Boolean(story.is_published),
      createdAt: new Date(story.created_at),
      updatedAt: new Date(story.updated_at),
      geminiSourceUrl: story.gemini_source_url || null,
      geminiEmbedUrl: story.gemini_embed_url || null,
      geminiId: story.gemini_id || null
    };

    return NextResponse.json({ story: structuredStory });
  } catch (error) {
    console.error('Error fetching story:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storyId = params.id;
    
    const contentType = request.headers.get('content-type') || '';
    let body: any = {};
    
    if (contentType.includes('application/json')) {
      try {
        body = await request.json();
      } catch (parseError) {
        return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
      }
    } else {
      const text = await request.text();
      if (text.trim()) {
        try {
          body = JSON.parse(text);
        } catch (parseError) {
          return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }
      }
    }

    const { title, content, isPublished, illustrations, audioFiles } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!content || typeof content !== 'object') {
      return NextResponse.json({ error: 'Content must be a valid object' }, { status: 400 });
    }

    const dbService = getDatabaseService();

    const updateStoryQuery = `
      UPDATE stories
      SET title = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    dbService.run(updateStoryQuery, [title, isPublished ? 1 : 0, storyId]);

    // Preserve existing page illustrations before deletion
    const existingPagesQuery = `
      SELECT page_number, language, illustration FROM story_pages
      WHERE story_id = ? AND illustration IS NOT NULL AND illustration != ''
    `;
    const existingPages = dbService.all(existingPagesQuery, [storyId]);
    const illustrationMap = new Map<string, string>();
    
    existingPages.forEach((row: any) => {
      const key = `${row.page_number}-${row.language}`;
      illustrationMap.set(key, row.illustration);
    });

    dbService.run('DELETE FROM story_pages WHERE story_id = ?', [storyId]);
    dbService.run('DELETE FROM story_page_audio WHERE story_id = ?', [storyId]);

    if (Array.isArray(illustrations) && illustrations.length > 0) {
      dbService.run('DELETE FROM story_illustrations WHERE story_id = ?', [storyId]);
      
      const insertIllustrationQuery = `
        INSERT INTO story_illustrations (story_id, illustration_url, order_index)
        VALUES (?, ?, ?)
      `;

      illustrations.forEach((url: string, index: number) => {
        if (url && typeof url === 'string') {
          dbService.run(insertIllustrationQuery, [storyId, url, index]);
        }
      });
    }

    if (content && typeof content === 'object') {
      const insertPageQuery = `
        INSERT INTO story_pages (story_id, language, page_number, text, illustration)
        VALUES (?, ?, ?, ?, ?)
      `;

      const insertPageAudioQuery = `
        INSERT INTO story_page_audio (story_id, page_number, language, audio_url)
        VALUES (?, ?, ?, ?)
      `;

      Object.entries(content).forEach(([language, pages]: [string, any]) => {
        if (!Array.isArray(pages)) return;

        pages.forEach((page: any, index: number) => {
          const pageNumber = page.pageNumber || index + 1;
          const pageText = page.text || '';
          
          const key = `${pageNumber}-${language}`;
          const preservedIllustration = illustrationMap.get(key);
          const pageIllustration = page.illustration || preservedIllustration || '';

          try {
            dbService.run(insertPageQuery, [storyId, language, pageNumber, pageText, pageIllustration]);
          } catch (error) {
            console.error(`Error saving ${language} page ${pageNumber}:`, error);
          }

          if (page.audio) {
            const audioUrl = typeof page.audio === 'string' ? page.audio : '';
            if (audioUrl) {
              try {
                dbService.run(insertPageAudioQuery, [storyId, pageNumber, language, audioUrl]);
              } catch (error) {
                console.error(`Error saving ${language} page ${pageNumber} audio:`, error);
              }
            }
          }
        });
      });
    }

    if (audioFiles && typeof audioFiles === 'object' && Object.keys(audioFiles).length > 0) {
      const insertAudioQuery = `
        INSERT INTO story_audio_files (story_id, language, audio_url)
        VALUES (?, ?, ?)
      `;

      Object.entries(audioFiles).forEach(([language, url]: [string, any]) => {
        if (url && typeof url === 'string') {
          dbService.run(insertAudioQuery, [storyId, language, url]);
        }
      });
    }

    try {
      revalidatePath('/dashboard');
      revalidatePath('/stories');
      revalidatePath(`/stories/${storyId}`);
    } catch (error) {
      console.error('Cache revalidation error:', error);
    }

    return NextResponse.json({ success: true, message: 'Story updated successfully' });
  } catch (error) {
    console.error('Error updating story:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storyId = params.id;
    const dbService = getDatabaseService();

    const deleteQuery = 'DELETE FROM stories WHERE id = ?';
    const result = dbService.run(deleteQuery, [storyId]);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Catatan: gambar di CDN (imgcdn.dev) tidak dihapus karena free tier tidak support delete via API
    // Gambar akan tetap tersimpan di CDN permanent

    try {
      revalidatePath('/dashboard');
      revalidatePath('/stories');
      revalidatePath(`/stories/${storyId}`);
    } catch (error) {
      console.error('Cache revalidation error:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Story deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting story:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}