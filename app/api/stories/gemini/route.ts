// app/api/stories/gemini/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getDatabaseService } from '@/lib/db-service'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'public/uploads'

async function ensureUploadDir(subDir: string) {
  const dirPath = join(UPLOAD_DIR, subDir)
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true })
  }
}

async function handleFileUpload(file: File, subDir: string): Promise<string> {
  await ensureUploadDir(subDir)

  const buffer = await file.arrayBuffer()
  const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const ext = file.name.split('.').pop() || 'png'
  const fileName = `${fileId}.${ext}`
  const filePath = join(UPLOAD_DIR, subDir, fileName)

  await writeFile(filePath, Buffer.from(buffer))

  return `/uploads/${subDir}/${fileName}`
}

/**
 * POST - Create a new Gemini Storybook story entry
 * 
 * ✨ SIMPLIFIED VERSION - No metadata fetching
 * Handles file upload PROPERLY like manual story upload
 * 
 * Body (FormData):
 * {
 *   title: string (required),
 *   coverImage: File (required),
 *   geminiUrl: string (required - must be gemini.google.com/share/...),
 *   authorId: string (required),
 *   authorName: string (required),
 *   isPublished: boolean (optional, default false)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const title = formData.get('title') as string
    const geminiUrl = formData.get('geminiUrl') as string
    const authorId = formData.get('authorId') as string
    const authorName = formData.get('authorName') as string
    const isPublished = formData.get('isPublished') === 'true'
    const coverImageFile = formData.get('coverImage') as File | null

    // Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Judul cerita wajib diisi' },
        { status: 400 }
      )
    }

    if (!geminiUrl || !geminiUrl.trim()) {
      return NextResponse.json(
        { error: 'Link Gemini Storybook wajib diisi' },
        { status: 400 }
      )
    }

    if (!authorId) {
      return NextResponse.json(
        { error: 'Author ID diperlukan' },
        { status: 400 }
      )
    }

    if (!coverImageFile || coverImageFile.size === 0) {
      return NextResponse.json(
        { error: 'Gambar sampul wajib diisi' },
        { status: 400 }
      )
    }

    // Validate Gemini URL format
    if (!geminiUrl.includes('gemini.google.com/share')) {
      return NextResponse.json(
        { error: 'Link harus dari Gemini Storybook (gemini.google.com/share/...)' },
        { status: 400 }
      )
    }

    // Extract Gemini ID dari URL
    const geminiIdMatch = geminiUrl.match(/gemini\.google\.com\/share\/([a-zA-Z0-9]+)/)
    if (!geminiIdMatch || !geminiIdMatch[1]) {
      return NextResponse.json(
        { error: 'Format link Gemini tidak valid' },
        { status: 400 }
      )
    }

    const geminiId = geminiIdMatch[1]

    // Handle cover image upload (LIKE MANUAL UPLOAD)
    let coverImagePath = null
    try {
      coverImagePath = await handleFileUpload(coverImageFile, 'covers')
    } catch (error) {
      console.error('[Cover Upload Error]', error)
      return NextResponse.json(
        { 
          error: 'Gagal upload gambar sampul',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 400 }
      )
    }

    const dbService = getDatabaseService()

    // Ensure stories table exists dengan Gemini columns
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
    `

    dbService.exec(migrationSQL)

    const storyId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Insert story dengan Gemini info
    const insertStoryQuery = `
      INSERT INTO stories (
        id,
        title,
        cover_image,
        author_id,
        author_name,
        is_published,
        gemini_source_url,
        gemini_embed_url,
        gemini_id,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `

    dbService.run(insertStoryQuery, [
      storyId,
      title.trim(),
      coverImagePath,
      authorId,
      authorName || 'Unknown',
      isPublished ? 1 : 0,
      geminiUrl,
      `https://gemini.google.com/share/${geminiId}`,
      geminiId
    ])

    // Revalidate paths
    try {
      revalidatePath('/dashboard')
      revalidatePath('/stories')
      revalidatePath(`/stories/${storyId}`)
      revalidatePath(`/api/stories`)
    } catch (error) {
      console.error('Cache revalidation error:', error)
    }

    return NextResponse.json({
      success: true,
      storyId,
      message: 'Gemini Storybook berhasil disimpan'
    }, { status: 201 })

  } catch (error) {
    console.error('[Create Gemini Story Error]', error)
    return NextResponse.json(
      {
        error: 'Gagal membuat cerita Gemini',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}