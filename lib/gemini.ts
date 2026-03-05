// lib/gemini.ts - Gemini related utilities

export interface GeminiStoryResponse {
  title: string
  coverImage?: string
  stories?: {
    indonesian?: any[]
    sundanese?: any[]
    english?: any[]
  }
  [key: string]: any
}

export interface ParsedStoryData {
  title: string
  coverImage: string
  indonesian: any[]
  sundanese: any[]
  english: any[]
}

/**
 * Validate Gemini URL format
 */
export function isValidGeminiUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    // Add your Gemini domain validation here
    return true
  } catch {
    return false
  }
}

/**
 * Fetch and parse Gemini Storybook data
 */
export async function fetchGeminiStorybook(url: string): Promise<ParsedStoryData> {
  try {
    if (!isValidGeminiUrl(url)) {
      throw new Error('Invalid Gemini URL format')
    }

    const response = await fetch('/api/gemini/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ geminiUrl: url })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch Gemini Storybook')
    }

    const data = await response.json()
    return data as ParsedStoryData
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Unknown error fetching Gemini Storybook')
  }
}

/**
 * Normalize Gemini story data to our format
 */
export function normalizeGeminiData(data: GeminiStoryResponse): ParsedStoryData {
  return {
    title: data.title || 'Untitled Story',
    coverImage: data.coverImage || '',
    indonesian: data.stories?.indonesian || [],
    sundanese: data.stories?.sundanese || [],
    english: data.stories?.english || []
  }
}

// lib/file-utils.ts - File handling utilities

/**
 * Convert File to Base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeInBytes: number): boolean {
  return file.size <= maxSizeInBytes
}

/**
 * Validate file type
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type)
}

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop() || ''
}

/**
 * Generate safe filename
 */
export function generateSafeFilename(originalName: string): string {
  const ext = getFileExtension(originalName)
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `${timestamp}-${random}.${ext}`
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Check if file is image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * Check if file is audio
 */
export function isAudioFile(file: File): boolean {
  return file.type.startsWith('audio/')
}

/**
 * Create FormData with nested objects
 */
export function createFormDataWithNesting(data: Record<string, any>): FormData {
  const formData = new FormData()

  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return
    }

    if (value instanceof File) {
      formData.append(key, value)
    } else if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value))
    } else if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value))
    } else {
      formData.append(key, String(value))
    }
  })

  return formData
}

// lib/validation.ts - Form validation utilities

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

/**
 * Validate story form data
 */
export function validateStoryForm(data: {
  title: string
  coverImage: string | File | null
  indonesian: any[]
  sundanese: any[]
  english: any[]
}): ValidationResult {
  const errors: ValidationError[] = []

  // Validate title
  if (!data.title || !data.title.trim()) {
    errors.push({
      field: 'title',
      message: 'Title is required'
    })
  }

  // Validate cover image
  if (!data.coverImage) {
    errors.push({
      field: 'coverImage',
      message: 'Cover image is required'
    })
  }

  // Validate at least one language has content
  const hasContent = data.indonesian.length > 0 || 
                     data.sundanese.length > 0 || 
                     data.english.length > 0

  if (!hasContent) {
    errors.push({
      field: 'content',
      message: 'At least one language with content is required'
    })
  }

  // Validate each language content
  ;(['indonesian', 'sundanese', 'english'] as const).forEach(lang => {
    const pages = data[lang]
    pages.forEach((page, idx) => {
      if (!page.text || !page.text.trim()) {
        errors.push({
          field: `${lang}_${idx}_text`,
          message: `Text is required for ${lang} page ${idx + 1}`
        })
      }
    })
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate email
 */
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// lib/url-utils.ts - URL utilities

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return ''
  }
}

/**
 * Build query string
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.append(key, String(value))
    }
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

/**
 * Parse query string
 */
export function parseQueryString(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString)
  const result: Record<string, string> = {}
  
  params.forEach((value, key) => {
    result[key] = value
  })

  return result
}