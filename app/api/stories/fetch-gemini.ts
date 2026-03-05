// app/api/stories/fetch-gemini.ts
import { NextRequest, NextResponse } from 'next/server'

interface GeminiStoryPage {
  text: string
  illustration?: string
  audio?: string
}

interface GeminiStoryData {
  title: string
  coverImage?: string
  pages: {
    indonesian?: GeminiStoryPage[]
    sundanese?: GeminiStoryPage[]
    english?: GeminiStoryPage[]
  }
  [key: string]: any
}

/**
 * ✅ PERBAIKAN: Fetch Gemini Storybook data dari link
 * 
 * POST /api/stories/fetch-gemini
 * Body: { geminiLink: string }
 * 
 * Response:
 * {
 *   title: string,
 *   coverImage: string (base64 or URL),
 *   pages: {
 *     indonesian: [{ text, illustration, audio }],
 *     sundanese: [{ text, illustration, audio }],
 *     english: [{ text, illustration, audio }]
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { geminiLink } = await request.json()

    if (!geminiLink || typeof geminiLink !== 'string') {
      return NextResponse.json(
        { error: 'Link Gemini Storybook diperlukan' },
        { status: 400 }
      )
    }

    // Validate Gemini link format
    if (!geminiLink.includes('gemini') && !geminiLink.includes('google.com')) {
      return NextResponse.json(
        { error: 'Link harus dari Gemini atau Google (format Gemini Storybook)' },
        { status: 400 }
      )
    }

    // ✅ Fetch Gemini Storybook data
    // This would typically involve:
    // 1. Making a request to the Gemini Storybook share link
    // 2. Parsing the HTML/JSON response
    // 3. Extracting title, images, text, etc.
    
    // For now, we'll create a middleware that can parse the Gemini response
    const storyData = await fetchAndParseGeminiStorybook(geminiLink)

    if (!storyData) {
      return NextResponse.json(
        { error: 'Tidak dapat mengunduh data dari Gemini Storybook. Pastikan link valid dan public.' },
        { status: 400 }
      )
    }

    // Ensure required data is present
    if (!storyData.title) {
      storyData.title = 'Cerita dari Gemini'
    }

    // Format response to match expected structure
    const formattedData = {
      title: storyData.title,
      coverImage: storyData.coverImage || '',
      pages: {
        indonesian: formatPages(storyData.pages?.indonesian || storyData.pages || []),
        sundanese: formatPages(storyData.pages?.sundanese || []),
        english: formatPages(storyData.pages?.english || [])
      },
      source: 'gemini',
      sourceLink: geminiLink
    }

    return NextResponse.json(formattedData)

  } catch (error) {
    console.error('[Fetch Gemini Error]', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Gagal memproses Gemini Storybook',
        details: 'Pastikan URL valid dan storybook bersifat public'
      },
      { status: 500 }
    )
  }
}

/**
 * Fetch dan parse Gemini Storybook content
 */
async function fetchAndParseGeminiStorybook(geminiLink: string): Promise<GeminiStoryData | null> {
  try {
    // Add timeout to prevent hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const response = await fetch(geminiLink, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`Failed to fetch Gemini page: ${response.status}`)
      return null
    }

    const html = await response.text()

    // ✅ Parse Gemini Storybook HTML/JSON
    // Look for structured data in the page
    const storyData = parseGeminiContent(html, geminiLink)

    return storyData

  } catch (error) {
    console.error('[Fetch Gemini Storybook Error]', error)
    return null
  }
}

/**
 * Parse Gemini Storybook content from HTML
 */
function parseGeminiContent(html: string, geminiLink: string): GeminiStoryData | null {
  try {
    // Try to extract JSON-LD structured data first
    const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>([^<]+)<\/script>/i)
    
    if (jsonLdMatch) {
      try {
        const structuredData = JSON.parse(jsonLdMatch[1])
        if (structuredData && (structuredData.name || structuredData.headline)) {
          return parseStructuredGeminiData(structuredData)
        }
      } catch (e) {
        // Continue to other parsing methods
      }
    }

    // Try to extract from meta tags and content
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i) ||
                       html.match(/<title>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1] : 'Cerita dari Gemini'

    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i)
    const coverImage = imageMatch ? imageMatch[1] : ''

    // Extract content from div with specific classes (Gemini Storybook format)
    const contentMatch = html.match(/<div[^>]*class="[^"]*storybook[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    
    const pages = []
    
    if (contentMatch) {
      // Parse pages from Gemini format
      const pageMatches = contentMatch[1].match(/<div[^>]*class="[^"]*page[^"]*"[^>]*>([\s\S]*?)<\/div>/gi)
      
      if (pageMatches) {
        pageMatches.forEach((pageHtml: string) => {
          const textMatch = pageHtml.match(/<p[^>]*>([^<]+)<\/p>/i)
          const imgMatch = pageHtml.match(/<img[^>]*src="([^"]+)"/i)
          
          pages.push({
            text: textMatch ? textMatch[1] : '',
            illustration: imgMatch ? imgMatch[1] : '',
            audio: undefined
          })
        })
      }
    }

    // If no pages found, try alternative parsing
    if (pages.length === 0) {
      // Look for paragraphs as pages
      const paraMatches = html.match(/<p[^>]*>([^<]+)<\/p>/gi) || []
      paraMatches.slice(0, 10).forEach(para => {
        const text = para.replace(/<[^>]+>/g, '').trim()
        if (text && text.length > 10) {
          pages.push({
            text,
            illustration: '',
            audio: undefined
          })
        }
      })
    }

    return {
      title,
      coverImage,
      pages: {
        indonesian: pages.length > 0 ? pages : [{ text: 'Halaman 1', illustration: '', audio: undefined }]
      }
    }

  } catch (error) {
    console.error('[Parse Gemini Content Error]', error)
    return null
  }
}

/**
 * Parse structured data (JSON-LD) from Gemini
 */
function parseStructuredGeminiData(data: any): GeminiStoryData | null {
  const pages: GeminiStoryPage[] = []

  const title = data.name || data.headline || 'Cerita dari Gemini'
  const coverImage = data.image?.[0] || data.thumbnailUrl || ''

  // Parse pages from structured data
  if (Array.isArray(data.hasPart)) {
    data.hasPart.forEach((part: any) => {
      pages.push({
        text: part.text || part.description || '',
        illustration: part.image?.[0] || part.image || '',
        audio: part.audio || undefined
      })
    })
  } else if (Array.isArray(data.chapters)) {
    data.chapters.forEach((chapter: any) => {
      pages.push({
        text: chapter.text || chapter.name || '',
        illustration: chapter.image || '',
        audio: chapter.audio || undefined
      })
    })
  } else if (data.description) {
    // Single page
    pages.push({
      text: data.description,
      illustration: coverImage,
      audio: undefined
    })
  }

  return {
    title,
    coverImage,
    pages: {
      indonesian: pages.length > 0 ? pages : [{ text: 'Cerita', illustration: '', audio: undefined }]
    }
  }
}

/**
 * Format pages to match expected structure
 */
function formatPages(pages: any[]): GeminiStoryPage[] {
  if (!Array.isArray(pages)) {
    return [{ text: 'Halaman 1', illustration: '', audio: undefined }]
  }

  return pages.map(page => {
    if (typeof page === 'string') {
      return {
        text: page,
        illustration: '',
        audio: undefined
      }
    }

    return {
      text: page.text || page.content || '',
      illustration: page.illustration || page.image || page.imageUrl || '',
      audio: page.audio || page.audioUrl || undefined
    }
  }).filter(page => page.text && page.text.length > 0)
}