import { NextRequest, NextResponse } from 'next/server'

interface GeminiResponse {
  title: string
  coverImage?: string
  stories?: {
    indonesian?: any[]
    sundanese?: any[]
    english?: any[]
  }
  [key: string]: any
}

function parseLanguageContent(data: GeminiResponse) {
  const result: Record<string, any> = {
    indonesian: [],
    sundanese: [],
    english: []
  }

  // Adapt based on actual Gemini Storybook API response structure
  if (data.stories) {
    result.indonesian = data.stories.indonesian || []
    result.sundanese = data.stories.sundanese || []
    result.english = data.stories.english || []
  }

  // Transform to match StoryPage interface
  return {
    indonesian: result.indonesian.map((page: any, idx: number) => ({
      pageNumber: idx + 1,
      text: page.text || page.content || '',
      illustration: page.image || page.illustration || ''
    })),
    sundanese: result.sundanese.map((page: any, idx: number) => ({
      pageNumber: idx + 1,
      text: page.text || page.content || '',
      illustration: page.image || page.illustration || ''
    })),
    english: result.english.map((page: any, idx: number) => ({
      pageNumber: idx + 1,
      text: page.text || page.content || '',
      illustration: page.image || page.illustration || ''
    }))
  }
}

export async function POST(request: NextRequest) {
  try {
    const { geminiUrl } = await request.json()

    if (!geminiUrl || typeof geminiUrl !== 'string') {
      return NextResponse.json(
        { error: 'Gemini URL is required and must be a string' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(geminiUrl)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Fetch data from Gemini Storybook API
    const response = await fetch(geminiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch Gemini Storybook: ${response.statusText}` },
        { status: response.status }
      )
    }

    const geminiData: GeminiResponse = await response.json()

    // Validate required fields
    if (!geminiData.title) {
      return NextResponse.json(
        { error: 'Gemini Storybook must have a title' },
        { status: 400 }
      )
    }

    // Parse and structure the data
    const parsedContent = parseLanguageContent(geminiData)

    return NextResponse.json({
      title: geminiData.title,
      coverImage: geminiData.coverImage || '',
      content: {
        indonesian: parsedContent.indonesian,
        sundanese: parsedContent.sundanese,
        english: parsedContent.english
      },
      geminiSourceUrl: geminiUrl
    })

  } catch (error) {
    console.error('Gemini parse error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse Gemini Storybook' },
      { status: 500 }
    )
  }
}