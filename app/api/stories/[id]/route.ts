// app/api/stories/[id]/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getDatabaseService } from '@/lib/db-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get story with pages
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

    // Get pages with their audio
    const pagesQuery = `
      SELECT sp.*, spa.audio_url as page_audio_url
      FROM story_pages sp
      LEFT JOIN story_page_audio spa ON sp.story_id = spa.story_id AND sp.page_number = spa.page_number AND sp.language = spa.language
      WHERE sp.story_id = ?
      ORDER BY sp.language, sp.page_number
    `;

    const pages = dbService.all(pagesQuery, [storyId]) as any[];

    // Group pages by language with audio
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

    // Get illustrations (for legacy support)
    const illustrationsQuery = `
      SELECT illustration_url FROM story_illustrations WHERE story_id = ? ORDER BY order_index
    `;

    const illustrations = dbService.all(illustrationsQuery, [storyId]) as any[];
    const illustrationUrls = illustrations.map((ill: any) => ill.illustration_url);

    // Get audio files (for legacy support - full story audio)
    const audioQuery = `
      SELECT language, audio_url FROM story_audio_files WHERE story_id = ?
    `;

    const audioFilesResult = dbService.all(audioQuery, [storyId]) as any[];
    const audioFiles: Record<string, string> = {};
    audioFilesResult.forEach((audio: any) => {
      audioFiles[audio.language] = audio.audio_url;
    });
    
    // Merge per-page audio into audioFiles as fallback if no legacy audio exists
    Object.entries(audioFilesByLanguage).forEach(([language, url]) => {
      if (!audioFiles[language]) {
        audioFiles[language] = url;
      }
    });

    // ✅ FIXED: Include Gemini fields in response
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
      // ✅ Gemini fields untuk detect Gemini stories
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
    
    // Handle JSON request
    if (contentType.includes('application/json')) {
      try {
        body = await request.json();
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        return NextResponse.json(
          { error: 'Invalid JSON format' },
          { status: 400 }
        );
      }
    } else {
      // Fallback for other content types
      const text = await request.text();
      if (text.trim()) {
        try {
          body = JSON.parse(text);
        } catch (parseError) {
          console.error('❌ Fallback parse error:', parseError);
          return NextResponse.json(
            { error: 'Invalid request body' },
            { status: 400 }
          );
        }
      }
    }

    const { title, content, isPublished, illustrations, audioFiles } = body;

    console.log('📥 PUT request received:', {
      storyId,
      title,
      contentKeys: Object.keys(content || {}),
      isPublished,
      illustrationsCount: illustrations?.length || 0
    });

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'object') {
      return NextResponse.json(
        { error: 'Content must be a valid object' },
        { status: 400 }
      );
    }

    const dbService = getDatabaseService();

    // Update story
    const updateStoryQuery = `
      UPDATE stories
      SET title = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    dbService.run(updateStoryQuery, [
      title,
      isPublished ? 1 : 0,
      storyId
    ]);

    // ✅ CRITICAL: Delete only story_pages (not illustrations)
    // This preserves existing illustrations while updating pages
    dbService.run('DELETE FROM story_pages WHERE story_id = ?', [storyId]);
    dbService.run('DELETE FROM story_page_audio WHERE story_id = ?', [storyId]);

    // ✅ IMPORTANT: Only delete illustrations if new ones provided
    if (illustrations && Array.isArray(illustrations) && illustrations.length > 0) {
      dbService.run('DELETE FROM story_illustrations WHERE story_id = ?', [storyId]);
    }

    // Insert new pages with all languages
    if (content && typeof content === 'object') {
      const insertPageQuery = `
        INSERT INTO story_pages (story_id, language, page_number, text, illustration)
        VALUES (?, ?, ?, ?, ?)
      `;

      const insertPageAudioQuery = `
        INSERT INTO story_page_audio (story_id, page_number, language, audio_url)
        VALUES (?, ?, ?, ?)
      `;

      // Process each language in content
      Object.entries(content).forEach(([language, pages]: [string, any]) => {
        if (!Array.isArray(pages)) {
          console.warn(`⚠️ Skipping ${language}: not an array`);
          return;
        }

        console.log(`📖 Processing ${language}: ${pages.length} pages`);

        pages.forEach((page: any, index: number) => {
          const pageNumber = page.pageNumber || index + 1;
          const pageText = page.text || '';
          const pageIllustration = page.illustration || '';

          // Insert page
          try {
            dbService.run(insertPageQuery, [
              storyId,
              language,
              pageNumber,
              pageText,
              pageIllustration
            ]);
            console.log(`  ✓ ${language} page ${pageNumber} saved`);
          } catch (error) {
            console.error(`  ❌ Error saving ${language} page ${pageNumber}:`, error);
          }

          // Insert page-specific audio if available
          if (page.audio) {
            const audioUrl = typeof page.audio === 'string' ? page.audio : '';
            if (audioUrl) {
              try {
                dbService.run(insertPageAudioQuery, [
                  storyId,
                  pageNumber,
                  language,
                  audioUrl
                ]);
              } catch (error) {
                console.error(`  ❌ Error saving ${language} page ${pageNumber} audio:`, error);
              }
            }
          }
        });
      });
    }

    // Insert new illustrations only if provided
    if (illustrations && Array.isArray(illustrations) && illustrations.length > 0) {
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

    // Insert audio files (legacy full-story audio) only if provided
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

    // Clear cache after successful update
    try {
      revalidatePath('/dashboard');
      revalidatePath('/stories');
      revalidatePath(`/stories/${storyId}`);
      revalidatePath(`/api/stories`);
      revalidatePath(`/api/stories/${storyId}`);
    } catch (error) {
      console.error('Cache revalidation error:', error);
    }

    console.log(`✅ Story ${storyId} updated successfully`);

    return NextResponse.json({
      success: true,
      message: 'Story updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating story:', error);
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

    // Delete story (cascade will handle related records)
    const deleteQuery = 'DELETE FROM stories WHERE id = ?';
    const result = dbService.run(deleteQuery, [storyId]);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Clear cache after successful deletion
    try {
      revalidatePath('/dashboard');
      revalidatePath('/stories');
      revalidatePath(`/stories/${storyId}`);
      revalidatePath(`/api/stories`);
      revalidatePath(`/api/stories/${storyId}`);
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