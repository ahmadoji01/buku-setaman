// /api/generate-illustration route
// app/api/generate-illustration/route.ts

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text, language, pageNumber } = await request.json()

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // Using OpenAI DALL-E 3 for image generation
    const prompt = `Create a children's book illustration for this story: "${text}". 
    Style: colorful, vibrant, kid-friendly, illustrated storybook style. 
    Make it engaging and appropriate for young readers.`

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard', // Use 'standard' for faster/cheaper generation
        style: 'vivid', // or 'natural'
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to generate illustration')
    }

    const imageUrl = data.data?.[0]?.url

    if (!imageUrl) {
      throw new Error('No image generated')
    }

    // Convert image URL to base64
    const imgResponse = await fetch(imageUrl)
    const buffer = await imgResponse.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const illustration = `data:image/png;base64,${base64}`

    return NextResponse.json({ illustration })
  } catch (error) {
    console.error('Illustration generation error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate illustration'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}