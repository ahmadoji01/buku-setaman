"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, ExternalLink, BookOpen, Cloud } from "lucide-react"
import Link from "next/link"

interface GeminiEmbedProps {
  geminiUrl: string
  title?: string
  description?: string
  coverImage?: string
  authorName?: string
  onEmbedLoaded?: () => void
}

export function GeminiEmbed({
  geminiUrl,
  title,
  description,
  coverImage,
  authorName,
  onEmbedLoaded
}: GeminiEmbedProps) {
  const [showFullscreen, setShowFullscreen] = useState(false)

  // Immediately show the metadata display since iframe won't work
  useEffect(() => {
    onEmbedLoaded?.()
  }, [onEmbedLoaded])

  const handleOpenFullscreen = () => {
    setShowFullscreen(true)
    // Open Gemini in new tab
    window.open(geminiUrl, 'gemini_storybook', 'width=1200,height=800')
  }

  return (
    <div className="w-full space-y-4">
      {/* Info Alert - Gemini can't be embedded */}
      <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <Cloud className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-900 dark:text-blue-100 text-sm">
          📚 <strong>Gemini Storybook:</strong> Cerita ini ditampilkan langsung dari Google Gemini. Klik tombol di bawah untuk membaca cerita dengan semua fitur interaktifnya.
        </AlertDescription>
      </Alert>

      {/* Story Metadata Card */}
      <Card className="overflow-hidden border-blue-200 dark:border-blue-800">
        <div className="grid md:grid-cols-3 gap-6 p-6">
          {/* Cover Image */}
          <div className="md:col-span-1 flex flex-col items-center justify-center">
            {coverImage && (
              <img
                src={coverImage}
                alt={title || 'Story cover'}
                className="w-full max-w-xs h-auto rounded-lg shadow-md object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            )}
            {!coverImage && (
              <div className="w-full max-w-xs aspect-video bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-lg flex items-center justify-center">
                <BookOpen className="h-16 w-16 text-blue-600 dark:text-blue-400 opacity-50" />
              </div>
            )}
          </div>

          {/* Story Info */}
          <div className="md:col-span-2 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                  <Cloud className="h-6 w-6 text-blue-500" />
                  {title || 'Cerita dari Gemini Storybook'}
                </h2>
                {authorName && (
                  <p className="text-sm text-muted-foreground">Oleh: {authorName}</p>
                )}
              </div>

              {description && (
                <div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {description}
                  </p>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-950/50 rounded p-3 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-900 dark:text-blue-100">
                  ✨ <strong>Fitur Interaktif:</strong> Buka cerita ini di Gemini untuk mendapatkan pengalaman membaca yang lengkap dengan animasi dan interaksi.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 flex-wrap">
              <Button
                onClick={handleOpenFullscreen}
                className="gap-2 flex-1 md:flex-initial"
                size="lg"
              >
                <BookOpen className="h-4 w-4" />
                Baca Cerita di Gemini
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <a
                  href={geminiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Buka di Tab Baru
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Info about Gemini stories */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-slate-50 dark:bg-slate-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Apa itu Gemini Storybook?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              Gemini Storybook adalah platform dari Google yang memungkinkan membuat cerita interaktif dengan AI. Cerita yang Anda lihat di sini adalah hasil pembuatan melalui platform tersebut.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 dark:bg-slate-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tips Membaca</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>Klik tombol "Baca Cerita di Gemini" di atas</li>
              <li>Cerita akan terbuka di window baru</li>
              <li>Nikmati pengalaman membaca interaktif penuh</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}