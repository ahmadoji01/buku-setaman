// lib/init-db.ts - FIXED VERSION
// Jalankan: npm run init-db atau npx ts-node lib/init-db.ts

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const setupDatabase = () => {
  console.log('📁 Creating/Opening database...');
  const db = new Database('bukusetaman.db');
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  try {
    console.log('📋 Creating schema...');
    
    // Create schema
    const migrationSQL = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT CHECK(role IN ('admin', 'teacher', 'public')) NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Stories table
      CREATE TABLE IF NOT EXISTS stories (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          cover_image TEXT,
          author_id TEXT NOT NULL,
          author_name TEXT NOT NULL,
          gemini_source_url TEXT DEFAULT NULL,
          gemini_embed_url TEXT DEFAULT NULL,
          gemini_id TEXT DEFAULT NULL,
          is_published INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Story pages table
      CREATE TABLE IF NOT EXISTS story_pages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          story_id TEXT NOT NULL,
          language TEXT CHECK(language IN ('indonesian', 'sundanese', 'english')) NOT NULL,
          page_number INTEGER NOT NULL,
          text TEXT NOT NULL,
          illustration TEXT,
          FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
          UNIQUE(story_id, language, page_number)
      );

      -- Story illustrations table
      CREATE TABLE IF NOT EXISTS story_illustrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          story_id TEXT NOT NULL,
          illustration_url TEXT NOT NULL,
          order_index INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
      );

      -- Story audio files table
      CREATE TABLE IF NOT EXISTS story_audio_files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          story_id TEXT NOT NULL,
          language TEXT CHECK(language IN ('indonesian', 'sundanese', 'english')) NOT NULL,
          audio_url TEXT NOT NULL,
          FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
          UNIQUE(story_id, language)
      );

      -- Story page audio table
      CREATE TABLE IF NOT EXISTS story_page_audio (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          story_id TEXT NOT NULL,
          page_number INTEGER NOT NULL,
          language TEXT NOT NULL,
          audio_url TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
      );

      -- Modules table
      CREATE TABLE IF NOT EXISTS modules (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          content TEXT NOT NULL,
          type TEXT CHECK(type IN ('ppt', 'pdf', 'blog')) NOT NULL,
          file_url TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Book progress table
      CREATE TABLE IF NOT EXISTS book_progress (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          story_id TEXT NOT NULL,
          current_page INTEGER NOT NULL DEFAULT 1,
          total_pages INTEGER NOT NULL,
          is_completed INTEGER NOT NULL DEFAULT 0,
          bookmarks TEXT,
          last_read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
          UNIQUE(user_id, story_id)
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_stories_author_id ON stories(author_id);
      CREATE INDEX IF NOT EXISTS idx_stories_is_published ON stories(is_published);
      CREATE INDEX IF NOT EXISTS idx_stories_gemini_source_url ON stories(gemini_source_url);
      CREATE INDEX IF NOT EXISTS idx_story_pages_story_id ON story_pages(story_id);
      CREATE INDEX IF NOT EXISTS idx_story_pages_language ON story_pages(language);
      CREATE INDEX IF NOT EXISTS idx_story_illustrations_story_id ON story_illustrations(story_id);
      CREATE INDEX IF NOT EXISTS idx_story_audio_story_id ON story_audio_files(story_id);
      CREATE INDEX IF NOT EXISTS idx_book_progress_user_id ON book_progress(user_id);
      CREATE INDEX IF NOT EXISTS idx_book_progress_story_id ON book_progress(story_id);
      CREATE INDEX IF NOT EXISTS idx_story_page_audio_story_id ON story_page_audio(story_id);
      CREATE INDEX IF NOT EXISTS idx_story_page_audio_language ON story_page_audio(language);
    `;

    db.exec(migrationSQL);
    console.log('✓ Schema created');
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    db.prepare('DELETE FROM story_pages').run();
    db.prepare('DELETE FROM story_page_audio').run();
    db.prepare('DELETE FROM story_illustrations').run();
    db.prepare('DELETE FROM story_audio_files').run();
    db.prepare('DELETE FROM book_progress').run();
    db.prepare('DELETE FROM stories').run();
    db.prepare('DELETE FROM modules').run();
    db.prepare('DELETE FROM users').run();
    
    // ✅ FIXED: Hash passwords properly with bcrypt
    console.log('👤 Creating users with hashed passwords...');
    const userStmt = db.prepare(`
      INSERT INTO users (id, name, email, password, role, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    // ✅ Hash admin password
    const adminPassword = bcrypt.hashSync('buku-setaman-admin-123', 10);
    userStmt.run('1', 'Admin User', 'admin@bukusetaman.com', adminPassword, 'admin', '2024-01-01 00:00:00', '2024-01-01 00:00:00');
    console.log('  ✓ Admin: admin@bukusetaman.com / buku-setaman-admin-123');
    
    // ✅ Hash teacher passwords
    const teacherPassword = bcrypt.hashSync('buku-setaman-teacher-123', 10);
    userStmt.run('2', 'Ibu Sari', 'sari@teacher.com', teacherPassword, 'teacher', '2024-01-15 00:00:00', '2024-01-15 00:00:00');
    console.log('  ✓ Teacher 1: sari@teacher.com / buku-setaman-teacher-123');
    
    userStmt.run('3', 'Pak Budi', 'budi@teacher.com', teacherPassword, 'teacher', '2024-01-20 00:00:00', '2024-01-20 00:00:00');
    console.log('  ✓ Teacher 2: budi@teacher.com / buku-setaman-teacher-123');
    
    // Insert sample stories
    console.log('📖 Creating sample stories...');
    const storyStmt = db.prepare(`
      INSERT INTO stories (id, title, cover_image, author_id, author_name, is_published, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    storyStmt.run('1', 'Kebun Sayur Kecil', '/covers/veggie-garden.jpg', '2', 'Ibu Sari', 1, '2024-02-01 00:00:00', '2024-02-01 00:00:00');
    storyStmt.run('2', 'Petualangan di Hutan', '/covers/forest-adventure.jpg', '3', 'Pak Budi', 1, '2024-02-05 00:00:00', '2024-02-05 00:00:00');
    console.log('  ✓ 2 sample stories created');
    
    // Insert story pages
    const pageStmt = db.prepare(`
      INSERT INTO story_pages (story_id, language, page_number, text, illustration)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    // Story 1 - Indonesian
    pageStmt.run('1', 'indonesian', 1, 'Di sebuah desa kecil, hiduplah seorang anak bernama Andi.', '/placeholder-x7vnw.png');
    pageStmt.run('1', 'indonesian', 2, 'Andi sangat suka berkebun dan memiliki kebun sayur kecil di belakang rumahnya.', '/placeholder-x7vnw.png');
    pageStmt.run('1', 'indonesian', 3, 'Setiap pagi, Andi menyiram tanaman-tanamannya dengan penuh kasih sayang.', '/placeholder-x7vnw.png');
    
    // Story 1 - Sundanese
    pageStmt.run('1', 'sundanese', 1, 'Di hiji kampung leutik, cicing budak nu ngaranna Andi.', '/placeholder-x7vnw.png');
    pageStmt.run('1', 'sundanese', 2, 'Andi resep pisan kebon jeung boga kebon sayur leutik di tukangeun imahna.', '/placeholder-x7vnw.png');
    pageStmt.run('1', 'sundanese', 3, 'Unggal isuk, Andi nyiram tutuwuhan-tutuwuhanna kalawan pinuh asih.', '/placeholder-x7vnw.png');
    
    // Story 1 - English
    pageStmt.run('1', 'english', 1, 'In a small village, there lived a child named Andi.', '/placeholder-x7vnw.png');
    pageStmt.run('1', 'english', 2, 'Andi loved gardening and had a small vegetable garden behind his house.', '/placeholder-x7vnw.png');
    pageStmt.run('1', 'english', 3, 'Every morning, Andi watered his plants with great care and love.', '/placeholder-x7vnw.png');
    
    // Story 2
    pageStmt.run('2', 'indonesian', 1, 'Sinta dan teman-temannya pergi berpetualang ke hutan.', '/children-forest-adventure-fruits.jpg');
    pageStmt.run('2', 'indonesian', 2, 'Mereka mencari buah-buahan liar yang bisa dimakan.', '/children-forest-adventure-fruits.jpg');
    pageStmt.run('2', 'english', 1, 'Sinta and her friends went on an adventure to the forest.', '/children-forest-adventure-fruits.jpg');
    pageStmt.run('2', 'english', 2, 'They looked for wild fruits that could be eaten.', '/children-forest-adventure-fruits.jpg');
    
    console.log('  ✓ Story pages created');
    
    // Insert illustrations
    const illustrationStmt = db.prepare(`
      INSERT INTO story_illustrations (story_id, illustration_url, order_index)
      VALUES (?, ?, ?)
    `);
    illustrationStmt.run('1', '/placeholder-x7vnw.png', 0);
    illustrationStmt.run('2', '/children-forest-adventure-fruits.jpg', 0);
    
    // Insert audio files
    const audioStmt = db.prepare(`
      INSERT INTO story_audio_files (story_id, language, audio_url)
      VALUES (?, ?, ?)
    `);
    audioStmt.run('1', 'indonesian', '/audio/kebun-sayur-id.mp3');
    audioStmt.run('1', 'sundanese', '/audio/kebun-sayur-su.mp3');
    audioStmt.run('1', 'english', '/audio/kebun-sayur-en.mp3');
    audioStmt.run('2', 'indonesian', '/audio/petualangan-hutan-id.mp3');
    audioStmt.run('2', 'english', '/audio/petualangan-hutan-en.mp3');
    
    // Insert modules
    const moduleStmt = db.prepare(`
      INSERT INTO modules (id, title, description, content, type, file_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    moduleStmt.run(
      '1',
      'Cara Membuat Cerita yang Menarik',
      'Panduan lengkap untuk guru dalam membuat cerita yang menarik untuk anak-anak',
      'Modul ini akan mengajarkan teknik-teknik dasar dalam membuat cerita yang menarik...',
      'blog',
      null,
      '2024-01-10 00:00:00',
      '2024-01-10 00:00:00'
    );
    moduleStmt.run(
      '2',
      'Penggunaan AI dalam Pendidikan',
      'Memahami cara menggunakan AI untuk meningkatkan kualitas pembelajaran',
      'Artificial Intelligence telah menjadi bagian penting dalam dunia pendidikan...',
      'ppt',
      '/modules/ai-education.pptx',
      '2024-01-25 00:00:00',
      '2024-01-25 00:00:00'
    );
    
    console.log('✓ Modules created');
    
    // Create triggers for automatic timestamp updates
    const triggers = `
      DROP TRIGGER IF EXISTS update_users_updated_at;
      CREATE TRIGGER update_users_updated_at 
          AFTER UPDATE ON users
          FOR EACH ROW
      BEGIN
          UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

      DROP TRIGGER IF EXISTS update_stories_updated_at;
      CREATE TRIGGER update_stories_updated_at 
          AFTER UPDATE ON stories
          FOR EACH ROW
      BEGIN
          UPDATE stories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

      DROP TRIGGER IF EXISTS update_modules_updated_at;
      CREATE TRIGGER update_modules_updated_at 
          AFTER UPDATE ON modules
          FOR EACH ROW
      BEGIN
          UPDATE modules SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `;
    
    db.exec(triggers);
    
    console.log('');
    console.log('✅ Database initialized successfully!');
    console.log('');
    console.log('📊 Database Summary:');
    console.log('   ✓ 3 users created (1 admin, 2 teachers)');
    console.log('   ✓ 2 sample stories created');
    console.log('   ✓ 10 story pages in 3 languages');
    console.log('   ✓ 2 modules created');
    console.log('');
    console.log('🔑 Login Credentials:');
    console.log('   Admin: admin@bukusetaman.com / buku-setaman-admin-123');
    console.log('   Teacher 1: sari@teacher.com / buku-setaman-teacher-123');
    console.log('   Teacher 2: budi@teacher.com / buku-setaman-teacher-123');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    db.close();
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

export default setupDatabase;