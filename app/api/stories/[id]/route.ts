import { NextRequest, NextResponse } from 'next/server';
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

    // Get pages
    const pagesQuery = `
      SELECT * FROM story_pages WHERE story_id = ? ORDER BY page_number
    `;

    const pages = dbService.all(pagesQuery, [storyId]) as any[];

    // Group pages by language
    const content: any = {};
    pages.forEach((page: any) => {
      if (!content[page.language]) {
        content[page.language] = [];
      }
      content[page.language].push({
        pageNumber: page.page_number,
        text: page.text,
        illustration: page.illustration
      });
    });

    // Get illustrations
    const illustrationsQuery = `
      SELECT illustration_url FROM story_illustrations WHERE story_id = ? ORDER BY order_index
    `;

    const illustrations = dbService.all(illustrationsQuery, [storyId]) as any[];
    const illustrationUrls = illustrations.map((ill: any) => ill.illustration_url);

    // Get audio files
    const audioQuery = `
      SELECT language, audio_url FROM story_audio_files WHERE story_id = ?
    `;

    const audioFilesResult = dbService.all(audioQuery, [storyId]) as any[];
    const audioFiles: Record<string, string> = {};
    audioFilesResult.forEach((audio: any) => {
      audioFiles[audio.language] = audio.audio_url;
    });

    const structuredStory = {
      id: story.id,
      title: story.title,
      content,
      authorId: story.author_id,
      authorName: story.author_name,
      illustrations: illustrationUrls,
      audioFiles,
      isPublished: Boolean(story.is_published),
      createdAt: new Date(story.created_at),
      updatedAt: new Date(story.updated_at)
    };

    return NextResponse.json({ story: structuredStory });
  } catch (error) {
    console.error('Error fetching story:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
    const body = await request.json();
    const { title, content, isPublished, illustrations, audioFiles } = body;

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

    // Delete existing pages, illustrations, and audio files
    dbService.run('DELETE FROM story_pages WHERE story_id = ?', [storyId]);
    dbService.run('DELETE FROM story_illustrations WHERE story_id = ?', [storyId]);
    dbService.run('DELETE FROM story_audio_files WHERE story_id = ?', [storyId]);

    // Insert new pages
    if (content) {
      const insertPageQuery = `
        INSERT INTO story_pages (story_id, language, page_number, text, illustration)
      `;

      Object.entries(content).forEach(([language, pages]: [string, any]) => {
        if (Array.isArray(pages)) {
          pages.forEach((page: any, index: number) => {
            dbService.run(insertPageQuery, [
              storyId,
              language,
              page.pageNumber || index + 1,
              page.text || '',
              page.illustration || ''
            ]);
          });
        }
      });
    }
    if (illustrations && Array.isArray(illustrations)) {
      const insertIllustrationQuery = `
        INSERT INTO story_illustrations (story_id, illustration_url, order_index)
        VALUES (?, ?, ?)
      `;

      illustrations.forEach((url: string, index: number) => {
        dbService.run(insertIllustrationQuery, [storyId, url, index]);
      });
    }

    // Insert new audio files
    if (audioFiles && typeof audioFiles === 'object') {
      const insertAudioQuery = `
        INSERT INTO story_audio_files (story_id, language, audio_url)
        VALUES (?, ?, ?)
      `;

      Object.entries(audioFiles).forEach(([language, url]: [string, any]) => {
        if (url) {
          dbService.run(insertAudioQuery, [storyId, language, url]);
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Story updated successfully'
    });
  } catch (error) {
    console.error('Error updating story:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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

    return NextResponse.json({
      success: true,
      message: 'Story deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting story:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
