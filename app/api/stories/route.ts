import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/lib/db-service';

export async function GET(request: NextRequest) {
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
      // Convert string "true"/"false" to boolean, or parse as integer if already numeric
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
    const body = await request.json();
    const { title, content, authorId, authorName, isPublished, illustrations, audioFiles } = body;

    if (!title || !content || !authorId || !authorName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const dbService = getDatabaseService();
    const storyId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert story
    const insertStoryQuery = `
      INSERT INTO stories (id, title, author_id, author_name, is_published, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    dbService.run(insertStoryQuery, [
      storyId,
      title,
      authorId,
      authorName,
      isPublished ? 1 : 0
    ]);

    // Insert pages for each language
    const insertPageQuery = `
      INSERT INTO story_pages (story_id, language, page_number, text, illustration)
      VALUES (?, ?, ?, ?, ?)
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

    // Insert illustrations if provided
    if (illustrations && Array.isArray(illustrations)) {
      const insertIllustrationQuery = `
        INSERT INTO story_illustrations (story_id, illustration_url, order_index)
        VALUES (?, ?, ?)
      `;

      illustrations.forEach((url: string, index: number) => {
        dbService.run(insertIllustrationQuery, [storyId, url, index]);
      });
    }

    // Insert audio files if provided
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
      storyId,
      message: 'Story created successfully'
    });
  } catch (error) {
    console.error('Error creating story:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
