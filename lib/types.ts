export type UserRole = "admin" | "teacher" | "public"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface StoryPage {
  pageNumber: number
  text: string
  illustration?: string
  audio?: string
  [key: string]: any
}

export interface StoryContent {
  indonesian: StoryPage[]
  sundanese: StoryPage[]
  english: StoryPage[]
}

export interface Story {
  id: string
  title: string
  coverImage?: string
  content: Record<string, StoryPage[]>
  authorId: string
  authorName: string
  illustrations?: string[]
  audioFiles?: Record<string, string>
  isPublished: boolean
  createdAt: Date | string
  updatedAt: Date | string
  gemini_source_url?: string | null
}

export interface CreateStoryInput {
  title: string
  coverImage: File | string
  indonesian: StoryPage[]
  sundanese?: StoryPage[]
  english?: StoryPage[]
  isPublished: boolean
  geminiSourceUrl?: string
}

export interface GeminiStoryData {
  title: string
  coverImage: string
  content: {
    indonesian: StoryPage[]
    sundanese: StoryPage[]
    english: StoryPage[]
  }
  geminiSourceUrl: string
}

export interface Module {
  id: string
  title: string
  description: string
  content: string
  type: "ppt" | "pdf" | "blog"
  fileUrl?: string
  createdAt: Date
  updatedAt: Date
}

export type Language = "indonesian" | "sundanese" | "english"

export interface BookProgress {
  userId: string
  storyId: string
  currentPage: number
  totalPages: number
  isCompleted: boolean
  bookmarks: number[]
  lastReadAt: Date
}

export const FILE_UPLOAD_CONFIG = {
  coverImage: {
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    folder: 'covers'
  },
  illustration: {
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    folder: 'illustrations'
  },
  audio: {
    maxSize: 10 * 1024 * 1024,
    allowedTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
    folder: 'audio'
  }
} as const
