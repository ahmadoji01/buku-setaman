export type UserRole = "admin" | "teacher" | "public"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface Story {
  id: string
  title: string
  coverImage?: string
  content: {
    indonesian?: StoryPage[]
    sundanese?: StoryPage[]
    english?: StoryPage[]
  }
  authorId: string
  authorName: string
  illustrations: string[]
  audioFiles: {
    indonesian?: string
    sundanese?: string
    english?: string
  }
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

export interface StoryPage {
  pageNumber: number
  text: string
  illustration?: string
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
