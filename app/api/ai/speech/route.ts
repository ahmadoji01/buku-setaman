import { type NextRequest, NextResponse } from "next/server"
import { getAIService } from "@/lib/ai-service"

export async function POST(request: NextRequest) {
  try {
    const { text, language = "id" } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    const aiService = getAIService()
    const audioUrl = await aiService.generateSpeech(text, language as "id" | "su" | "en")

    return NextResponse.json({
      success: true,
      audioUrl,
    })
  } catch (error) {
    console.error("Speech generation error:", error)
    return NextResponse.json({ error: "Failed to generate speech" }, { status: 500 })
  }
}
