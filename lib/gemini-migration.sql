-- Database Schema Update untuk Gemini Storybook Support
-- Execute ini di database migration atau langsung

-- Update stories table untuk add Gemini columns
ALTER TABLE stories ADD COLUMN gemini_source_url TEXT;
ALTER TABLE stories ADD COLUMN gemini_embed_url TEXT;
ALTER TABLE stories ADD COLUMN gemini_id TEXT;
ALTER TABLE stories ADD COLUMN gemini_description TEXT;

-- Create index untuk faster lookup
CREATE INDEX IF NOT EXISTS idx_stories_gemini_id ON stories(gemini_id);
CREATE INDEX IF NOT EXISTS idx_stories_gemini_source ON stories(gemini_source_url);
CREATE INDEX IF NOT EXISTS idx_stories_published ON stories(is_published);
CREATE INDEX IF NOT EXISTS idx_stories_author ON stories(author_id);

-- View untuk fetch semua stories dengan Gemini info
CREATE VIEW IF NOT EXISTS stories_with_metadata AS
SELECT 
  s.id,
  s.title,
  s.cover_image,
  s.author_id,
  s.author_name,
  s.is_published,
  s.created_at,
  s.updated_at,
  s.gemini_source_url,
  s.gemini_embed_url,
  s.gemini_id,
  s.gemini_description,
  CASE WHEN s.gemini_source_url IS NOT NULL THEN 1 ELSE 0 END as is_gemini
FROM stories s;

-- Queries yang useful

-- Get all Gemini stories
-- SELECT * FROM stories WHERE gemini_source_url IS NOT NULL;

-- Get all manual stories
-- SELECT * FROM stories WHERE gemini_source_url IS NULL;

-- Get published Gemini stories
-- SELECT * FROM stories WHERE gemini_source_url IS NOT NULL AND is_published = 1;

-- Get user's Gemini stories
-- SELECT * FROM stories WHERE author_id = ? AND gemini_source_url IS NOT NULL;

-- Get story dengan semua details
-- SELECT s.*, 
--        COUNT(DISTINCT sp.id) as page_count,
--        GROUP_CONCAT(DISTINCT sp.language) as languages
-- FROM stories s
-- LEFT JOIN story_pages sp ON s.id = sp.story_id
-- WHERE s.id = ?
-- GROUP BY s.id;