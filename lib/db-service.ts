import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import type { User } from './types';

class DatabaseService {
  private db: Database.Database;

  constructor() {
    this.db = new Database('bukusetaman.db');
    this.db.pragma('foreign_keys = ON');
  }

  // User authentication methods
  async findUserByEmail(email: string): Promise<User | null> {
    try {
      const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
      const user = stmt.get(email) as any;

      if (!user) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at),
      };
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    try {
      const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
      const user = stmt.get(email) as any;

      if (!user) return null;

      // For demo purposes, we'll do a simple password comparison
      // In production, you'd use bcrypt.compare()
      const isValidPassword = user.password === password;

      if (!isValidPassword) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at),
      };
    } catch (error) {
      console.error('Error authenticating user:', error);
      return null;
    }
  }

  // Helper method to hash passwords (for future use)
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  // Helper method to verify passwords (for future use)
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Check if user is authenticated based on session cookie
  async isAuthenticated(sessionEmail?: string): Promise<boolean> {
    try {
      if (!sessionEmail) return false;

      const user = await this.findUserByEmail(sessionEmail);
      return user !== null;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  // Get stories by author ID from database
  async getStoriesByAuthorFromDB(authorId: string): Promise<any[]> {
    try {
      const storiesQuery = `
        SELECT s.id, s.title, s.author_id, s.author_name, s.is_published, s.created_at, s.updated_at
        FROM stories s
        WHERE s.author_id = ?
        ORDER BY s.created_at DESC
      `;

      const stories = this.db.prepare(storiesQuery).all(authorId) as any[];

      // For each story, fetch related data
      const storiesWithContent = stories.map(story => {
        // Get story pages for each language
        const pagesQuery = `
          SELECT language, page_number, text, illustration
          FROM story_pages
          WHERE story_id = ?
          ORDER BY language, page_number
        `;

        const pages = this.db.prepare(pagesQuery).all(story.id) as any[];

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
          SELECT illustration_url
          FROM story_illustrations
          WHERE story_id = ?
          ORDER BY order_index
        `;

        const illustrations = this.db.prepare(illustrationsQuery).all(story.id) as any[];
        const illustrationUrls = illustrations.map((ill: any) => ill.illustration_url);

        // Get audio files
        const audioQuery = `
          SELECT language, audio_url
          FROM story_audio_files
          WHERE story_id = ?
        `;

        const audioFilesResult = this.db.prepare(audioQuery).all(story.id) as any[];
        const audioFiles: any = {};
        audioFilesResult.forEach((audio: any) => {
          audioFiles[audio.language] = audio.audio_url;
        });

        return {
          id: story.id,
          title: story.title,
          content,
          authorId: story.author_id,
          authorName: story.author_name,
          illustrations: illustrationUrls,
          audioFiles,
          isPublished: Boolean(story.is_published),
          createdAt: new Date(story.created_at),
          updatedAt: new Date(story.updated_at),
        };
      });

      return storiesWithContent;
    } catch (error) {
      console.error('Error getting stories by author from database:', error);
      return [];
    }
  }

  // Get published stories from database
  async getPublishedStoriesFromDB(limit: number = 6): Promise<any[]> {
    try {
      const storiesQuery = `
        SELECT s.id, s.title, s.author_id, s.author_name, s.is_published, s.created_at, s.updated_at
        FROM stories s
        WHERE s.is_published = 1
        ORDER BY s.created_at DESC
        LIMIT ?
      `;

      const stories = this.db.prepare(storiesQuery).all(limit) as any[];

      // For each story, fetch related data
      const storiesWithContent = stories.map(story => {
        // Get story pages for each language
        const pagesQuery = `
          SELECT language, page_number, text, illustration
          FROM story_pages
          WHERE story_id = ?
          ORDER BY language, page_number
        `;

        const pages = this.db.prepare(pagesQuery).all(story.id) as any[];

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
          SELECT illustration_url
          FROM story_illustrations
          WHERE story_id = ?
          ORDER BY order_index
        `;

        const illustrations = this.db.prepare(illustrationsQuery).all(story.id) as any[];
        const illustrationUrls = illustrations.map((ill: any) => ill.illustration_url);

        // Get audio files
        const audioQuery = `
          SELECT language, audio_url
          FROM story_audio_files
          WHERE story_id = ?
        `;

        const audioFilesResult = this.db.prepare(audioQuery).all(story.id) as any[];
        const audioFiles: any = {};
        audioFilesResult.forEach((audio: any) => {
          audioFiles[audio.language] = audio.audio_url;
        });

        return {
          id: story.id,
          title: story.title,
          content,
          authorId: story.author_id,
          authorName: story.author_name,
          illustrations: illustrationUrls,
          audioFiles,
          isPublished: Boolean(story.is_published),
          createdAt: new Date(story.created_at),
          updatedAt: new Date(story.updated_at),
        };
      });

      return storiesWithContent;
    } catch (error) {
      console.error('Error getting published stories from database:', error);
      return [];
    }
  }

  close(): void {
    this.db.close();
  }

  // Public methods for API routes
  prepare(sql: string): Database.Statement {
    return this.db.prepare(sql);
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  all<T = unknown>(sql: string, params?: readonly any[]): T[] {
    const stmt = this.db.prepare(sql);
    return params ? stmt.all(params) as T[] : stmt.all() as T[];
  }

  get<T = unknown>(sql: string, params?: readonly any[]): T | undefined {
    const stmt = this.db.prepare(sql);
    return params ? stmt.get(params) as T | undefined : stmt.get() as T | undefined;
  }

  run(sql: string, params?: readonly any[]): Database.RunResult {
    const stmt = this.db.prepare(sql);
    return params ? stmt.run(params) : stmt.run();
  }
}

// Singleton instance
let dbServiceInstance: DatabaseService | null = null;

export function getDatabaseService(): DatabaseService {
  if (!dbServiceInstance) {
    dbServiceInstance = new DatabaseService();
  }
  return dbServiceInstance;
}

export default DatabaseService;
