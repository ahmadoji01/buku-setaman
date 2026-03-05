// lib/gemini-utils.ts

/**
 * Utility functions untuk Gemini Storybook handling
 */

export interface GeminiMetadata {
  title: string
  description: string
  coverImage: string | null
  geminiId: string
}

/**
 * Validate Gemini URL format
 * @param url URL untuk di-validate
 * @returns boolean
 */
export function isValidGeminiUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname === 'gemini.google.com' && urlObj.pathname.includes('/share/')
  } catch {
    return false
  }
}

/**
 * Extract Gemini ID dari URL
 * @param url Gemini Storybook URL
 * @returns Gemini ID atau null
 */
export function extractGeminiId(url: string): string | null {
  const match = url.match(/gemini\.google\.com\/share\/([a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

/**
 * Build embed URL untuk Gemini Storybook
 * @param geminiId Gemini share ID
 * @returns Embed URL
 */
export function buildGeminiEmbedUrl(geminiId: string): string {
  return `https://gemini.google.com/share/${geminiId}`
}

/**
 * Format Gemini URL ke standard format
 * @param url Input URL
 * @returns Normalized URL
 */
export function normalizeGeminiUrl(url: string): string {
  const id = extractGeminiId(url)
  if (!id) {
    throw new Error('Invalid Gemini URL')
  }
  return buildGeminiEmbedUrl(id)
}

/**
 * Fetch Gemini metadata melalui API
 * @param geminiUrl Gemini Storybook URL
 * @returns Promise<GeminiMetadata>
 */
export async function fetchGeminiMetadata(geminiUrl: string): Promise<GeminiMetadata> {
  if (!isValidGeminiUrl(geminiUrl)) {
    throw new Error('Invalid Gemini URL format')
  }

  const response = await fetch('/api/gemini-embed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ geminiUrl })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch Gemini metadata')
  }

  const data = await response.json()
  const geminiId = extractGeminiId(geminiUrl)

  if (!geminiId) {
    throw new Error('Could not extract Gemini ID')
  }

  return {
    title: data.title || 'Cerita dari Gemini Storybook',
    description: data.description || '',
    coverImage: data.coverImage || null,
    geminiId
  }
}

/**
 * Create Gemini story entry
 * @param data Story data dengan Gemini info
 * @returns Promise<{storyId: string}>
 */
export async function createGeminiStory(data: {
  title: string
  description: string
  coverImage: string | null
  geminiUrl: string
  geminiId: string
  authorId: string
  authorName: string
  isPublished: boolean
}): Promise<{ storyId: string }> {
  const response = await fetch('/api/stories/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create Gemini story')
  }

  return await response.json()
}

/**
 * Check if story is Gemini-based
 * @param geminiSourceUrl Gemini source URL
 * @returns boolean
 */
export function isGeminiStory(geminiSourceUrl?: string | null): boolean {
  return !!geminiSourceUrl && geminiSourceUrl.includes('gemini.google.com')
}

/**
 * Get display name untuk story type
 * @param isGemini Boolean indicating Gemini story
 * @returns Display name
 */
export function getStoryTypeDisplay(isGemini: boolean): string {
  return isGemini ? 'Gemini Storybook' : 'Manual Upload'
}

/**
 * Get story type icon/badge color
 * @param isGemini Boolean indicating Gemini story
 * @returns Color class untuk Tailwind
 */
export function getStoryTypeColor(isGemini: boolean): string {
  return isGemini ? 'bg-blue-500/90' : 'bg-gray-500/90'
}

/**
 * Validate metadata completeness
 * @param metadata Gemini metadata
 * @returns boolean
 */
export function isMetadataComplete(metadata: Partial<GeminiMetadata>): boolean {
  return !!(metadata.title && metadata.geminiId)
}

/**
 * Format error message untuk Gemini operations
 * @param error Original error
 * @returns User-friendly error message
 */
export function formatGeminiError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('Invalid Gemini URL')) {
      return 'URL tidak valid. Pastikan link dari gemini.google.com/share/'
    }
    if (error.message.includes('fetch')) {
      return 'Gagal terhubung ke Gemini Storybook. Pastikan storybook bersifat Public.'
    }
    return error.message
  }
  return 'Terjadi kesalahan saat memproses Gemini Storybook'
}

/**
 * Check image URL validity
 * @param url Image URL
 * @returns boolean
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const urlObj = new URL(url)
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(urlObj.pathname) || 
           url.includes('image') || 
           url.includes('img')
  } catch {
    return false
  }
}

// lib/story-utils.ts

/**
 * Utility functions untuk story management
 */

export interface StoryListItem {
  id: string
  title: string
  coverImage?: string
  authorName: string
  isPublished: boolean
  geminiSourceUrl?: string | null
  createdAt: string
}

/**
 * Get story preview text
 * @param story Story dengan content
 * @param maxLength Max characters
 * @returns Preview text
 */
export function getStoryPreview(story: any, maxLength: number = 120): string {
  const content = story.content?.indonesian

  if (Array.isArray(content)) {
    return content
      .map((page: any) => page.text)
      .join(' ')
      .substring(0, maxLength) + '...'
  }

  if (typeof content === 'string') {
    return content.substring(0, maxLength) + '...'
  }

  return 'Tidak ada preview'
}

/**
 * Get story cover image URL
 * @param story Story data
 * @param fallback Fallback image
 * @returns Image URL
 */
export function getStoryCoverImage(story: any, fallback: string = '/placeholder.svg'): string {
  return story.coverImage || story.illustrations?.[0] || fallback
}

/**
 * Format story date
 * @param dateString Date string
 * @param locale Locale untuk formatting
 * @returns Formatted date
 */
export function formatStoryDate(dateString: string | Date, locale: string = 'id-ID'): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  return date.toLocaleDateString(locale)
}

/**
 * Get available languages dari story
 * @param story Story dengan content
 * @returns Array of language codes
 */
export function getAvailableLanguages(story: any): string[] {
  return Object.keys(story.content || {})
}

/**
 * Group stories by type
 * @param stories Array of stories
 * @returns Grouped stories
 */
export function groupStoriesByType(stories: StoryListItem[]): {
  gemini: StoryListItem[]
  manual: StoryListItem[]
} {
  return {
    gemini: stories.filter(s => !!s.geminiSourceUrl),
    manual: stories.filter(s => !s.geminiSourceUrl)
  }
}

/**
 * Filter stories
 * @param stories Array of stories
 * @param filters Filter options
 * @returns Filtered stories
 */
export function filterStories(
  stories: StoryListItem[],
  filters: {
    published?: boolean
    type?: 'all' | 'gemini' | 'manual'
    author?: string
  }
): StoryListItem[] {
  return stories.filter(story => {
    if (filters.published !== undefined && story.isPublished !== filters.published) {
      return false
    }

    if (filters.type === 'gemini' && !story.geminiSourceUrl) {
      return false
    }

    if (filters.type === 'manual' && story.geminiSourceUrl) {
      return false
    }

    if (filters.author && story.authorName !== filters.author) {
      return false
    }

    return true
  })
}