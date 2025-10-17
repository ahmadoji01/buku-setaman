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

    // Language mapping for TTS
    const languageMap: Record<string, string> = {
      indonesian: 'id-ID',
      sundanese: 'id-ID', // Sundanese not widely supported, use Indonesian
      english: 'en-US',
    }

    const voiceLanguage = languageMap[language] || 'en-US'

    // Using Google Cloud Text-to-Speech (cheap tier available)
    // Alternative: Use Azure TTS, AWS Polly, or ElevenLabs
    const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          text: text,
        },
        voice: {
          languageCode: voiceLanguage,
          name: getVoiceName(voiceLanguage), // e.g., 'id-ID-Neural2-B'
          ssmlGender: 'FEMALE', // Or MALE
        },
        audioConfig: {
          audioEncoding: 'MP3',
          pitch: 0.8, // Slightly higher for children's content
          speakingRate: 0.9, // Slightly slower for clarity
        },
      }),
      headers: {
        'X-Goog-Api-Key': process.env.GOOGLE_TTS_API_KEY,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to generate audio')
    }

    const audioContent = data.audioContent
    const audio = `data:audio/mpeg;base64,${audioContent}`

    return NextResponse.json({ audio })
  } catch (error) {
    console.error('Audio generation error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate audio'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

function getVoiceName(languageCode: string): string {
  const voices: Record<string, string> = {
    'en-US': 'en-US-Neural2-C', // American English
    'id-ID': 'id-ID-Neural2-B', // Indonesian
  }
  return voices[languageCode] || 'en-US-Neural2-C'
}