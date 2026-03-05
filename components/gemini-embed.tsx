"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, ExternalLink, Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"

interface GeminiEmbedProps {
  geminiUrl: string
  title?: string
  description?: string
  onEmbedLoaded?: () => void
}

export function GeminiEmbed({
  geminiUrl,
  title,
  description,
  onEmbedLoaded
}: GeminiEmbedProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const maxAttempts = 3

  useEffect(() => {
    // Simulate loading state
    const timer = setTimeout(() => {
      setIsLoading(false)
      onEmbedLoaded?.()
    }, 2000)

    return () => clearTimeout(timer)
  }, [iframeKey, onEmbedLoaded])

  const handleIframeError = () => {
    console.warn('[GeminiEmbed] Iframe failed to load')
    setHasError(true)
    setIsLoading(false)
    
    // Retry logic
    if (attempts < maxAttempts) {
      setTimeout(() => {
        setAttempts(prev => prev + 1)
        setIframeKey(prev => prev + 1)
        setIsLoading(true)
        setHasError(false)
      }, 2000)
    }
  }

  const handleRetry = () => {
    setAttempts(0)
    setIframeKey(prev => prev + 1)
    setIsLoading(true)
    setHasError(false)
  }

  return (
    <div className="w-full space-y-4">
      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📚 {title || 'Gemini Storybook'}
          </CardTitle>
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Cerita ini ditampilkan langsung dari Gemini Storybook. Anda dapat berinteraksi penuh dengan cerita di dalam tampilan ini.
            </p>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="ml-4"
            >
              <a
                href={geminiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                Buka di Gemini
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Embed Container */}
      <div className="relative bg-muted rounded-lg overflow-hidden border">
        {isLoading && (
          <div className="absolute inset-0 bg-muted/50 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Memuat Gemini Storybook...</p>
            </div>
          </div>
        )}

        <div className="aspect-video relative bg-white">
          <iframe
            key={iframeKey}
            src={geminiUrl}
            title={title || 'Gemini Storybook'}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; camera; microphone"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
            onLoad={() => {
              setIsLoading(false)
              onEmbedLoaded?.()
            }}
            onError={handleIframeError}
          />
        </div>
      </div>

      {/* Error Alert dengan Retry */}
      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <p>
              Tidak dapat menampilkan Gemini Storybook dalam iframe
              {attempts > 0 && ` (Percobaan ${attempts}/${maxAttempts})`}
            </p>
            <div className="flex gap-2 mt-2">
              <Button
                onClick={handleRetry}
                variant="outline"
                size="sm"
                disabled={attempts >= maxAttempts}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Coba Lagi
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
              >
                <a
                  href={geminiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2 inline-flex"
                >
                  Buka di Tab Baru
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          💡 <strong>Tips:</strong> Jika Gemini Storybook tidak menampil dengan baik, buka di tab baru untuk pengalaman penuh.
        </AlertDescription>
      </Alert>
    </div>
  )
}