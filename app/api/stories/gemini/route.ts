// app/api/stories/gemini/route.ts - UPDATED dengan imgcdn.dev CDN
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getDatabaseService } from '@/lib/db-service'
import { uploadImageToCDN } from '@/lib/imgcdn-service'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const title = formData.get('title') as string
    const geminiUrl = formData.get('geminiUrl') as string
    const authorId = formData.get('authorId') as string
    const authorName = formData.get('authorName') as string
    const isPublished = formData.get('isPublished') === 'true'
    const coverImageFile = formData.get('coverImage') as File | null

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Judul cerita wajib diisi' }, { status: 400 })
    }

    if (!geminiUrl || !geminiUrl.trim()) {
      return NextResponse.json({ error: 'Link Gemini Storybook wajib diisi' }, { status: 400 })
    }

    if (!authorId) {
      return NextResponse.json({ error: 'Author ID diperlukan' }, { status: 400 })
    }

    if (!coverImageFile || coverImageFile.size === 0) {
      return NextResponse.json({ error: 'Gambar sampul wajib diisi' }, { status: 400 })
    }

    if (!geminiUrl.includes('gemini.google.com/share')) {
      return NextResponse.json(
        { error: 'Link harus dari Gemini Storybook (gemini.google.com/share/...)' },
        { status: 400 }
      )
    }

    const geminiIdMatch = geminiUrl.match(/gemini\.google\.com\/share\/([a-zA-Z0-9]+)/)
    if (!geminiIdMatch || !geminiIdMatch[1]) {
      return NextResponse.json({ error: 'Format link Gemini tidak valid' }, { status: 400 })
    }

    const geminiId = geminiIdMatch[1]

    // Upload cover image ke imgcdn.dev CDN
    let coverImageUrl = null
    try {
      const cdnResult = await uploadImageToCDN(coverImageFile)
      coverImageUrl = cdnResult.url
      console.log('[Gemini] Cover image uploaded to CDN:', coverImageUrl)
    } catch (error) {
      console.error('[Gemini Cover Upload Error]', error)
      return NextResponse.json(
        { 
          error: 'Gagal upload gambar sampul ke CDN',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 400 }
      )
    }

    const dbService = getDatabaseService()

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
      coverImageUrl,
      authorId,
      authorName || 'Unknown',
      isPublished ? 1 : 0,
      geminiUrl,
      `https://gemini.google.com/share/${geminiId}`,
      geminiId
    ])

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
      message: 'Gemini Storybook berhasil disimpan dengan CDN image'
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