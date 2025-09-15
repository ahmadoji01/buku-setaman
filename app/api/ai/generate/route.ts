import { type NextRequest, NextResponse } from "next/server"
import { getAIService } from "@/lib/ai-service"

export async function POST(request: NextRequest) {
  try {
    const { storyText, language = "id" } = await request.json()

    if (!storyText) {
      return NextResponse.json({ error: "Story text is required" }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    const aiService = getAIService()
    const result = await aiService.generateStoryContent(storyText)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      illustrations: result.illustrations,
      audioUrl: result.audioUrl,
    })
  } catch (error) {
    console.error("AI generation error:", error)
    return NextResponse.json({ error: "Failed to generate AI content" }, { status: 500 })
  }
}
