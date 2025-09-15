interface AIGenerationResult {
  illustrations: string[]
  audioUrl?: string
  error?: string
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export class AIService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateIllustrationPrompts(storyText: string): Promise<string[]> {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content:
                "You are an expert at creating detailed illustration prompts for children's storybooks. Generate 3-5 detailed visual prompts that would make engaging illustrations for the given story. Each prompt should be descriptive, child-friendly, and capture key moments or scenes from the story. Return only the prompts, one per line.",
            },
            {
              role: "user",
              content: `Create illustration prompts for this children's story: ${storyText}`,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data: OpenAIResponse = await response.json()
      const prompts = data.choices[0]?.message?.content?.split("\n").filter(Boolean) || []

      return prompts.slice(0, 5) // Limit to 5 prompts
    } catch (error) {
      console.error("Error generating illustration prompts:", error)
      throw new Error("Failed to generate illustration prompts")
    }
  }

  async generateImages(prompts: string[]): Promise<string[]> {
    try {
      const imagePromises = prompts.map(async (prompt) => {
        const response = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: `Children's book illustration style: ${prompt}. Colorful, friendly, educational, suitable for kids aged 5-10.`,
            n: 1,
            size: "1024x1024",
            quality: "standard",
          }),
        })

        if (!response.ok) {
          throw new Error(`DALL-E API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data[0]?.url || ""
      })

      const imageUrls = await Promise.all(imagePromises)
      return imageUrls.filter(Boolean)
    } catch (error) {
      console.error("Error generating images:", error)
      throw new Error("Failed to generate images")
    }
  }

  async generateSpeech(text: string, language: "id" | "su" | "en" = "id"): Promise<string> {
    try {
      // Map language codes to OpenAI TTS voices
      const voiceMap = {
        id: "nova", // Indonesian - use Nova voice
        su: "nova", // Sundanese - use Nova voice (closest available)
        en: "alloy", // English - use Alloy voice
      }

      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          input: text,
          voice: voiceMap[language],
          response_format: "mp3",
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI TTS API error: ${response.status}`)
      }

      // Convert response to blob and create URL
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      return audioUrl
    } catch (error) {
      console.error("Error generating speech:", error)
      throw new Error("Failed to generate speech")
    }
  }

  async generateStoryContent(storyText: string): Promise<AIGenerationResult> {
    try {
      // Generate illustration prompts
      const prompts = await this.generateIllustrationPrompts(storyText)

      // Generate images from prompts
      const illustrations = await this.generateImages(prompts)

      // Generate audio narration
      const audioUrl = await this.generateSpeech(storyText)

      return {
        illustrations,
        audioUrl,
      }
    } catch (error) {
      console.error("Error in AI generation:", error)
      return {
        illustrations: [],
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }
}

// Singleton instance
let aiServiceInstance: AIService | null = null

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    const apiKey = process.env.OPENAI_API_KEY || ""
    if (!apiKey) {
      throw new Error("OpenAI API key not configured")
    }
    aiServiceInstance = new AIService(apiKey)
  }
  return aiServiceInstance
}
