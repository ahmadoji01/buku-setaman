"use client"

import { useState } from "react"

interface AIGenerationResult {
  illustrations: string[]
  audioUrl?: string
  error?: string
}

interface UseAIGenerationReturn {
  generateContent: (storyText: string) => Promise<AIGenerationResult>
  generateSpeech: (text: string, language?: string) => Promise<string | null>
  isGenerating: boolean
  error: string | null
}

export function useAIGeneration(): UseAIGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateContent = async (storyText: string): Promise<AIGenerationResult> => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ storyText }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate content")
      }

      return {
        illustrations: data.illustrations || [],
        audioUrl: data.audioUrl,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
      return {
        illustrations: [],
        error: errorMessage,
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const generateSpeech = async (text: string, language = "id"): Promise<string | null> => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, language }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate speech")
      }

      return data.audioUrl
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
      return null
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    generateContent,
    generateSpeech,
    isGenerating,
    error,
  }
}
