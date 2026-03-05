// app/stories/[id]/page.tsx
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Share2, Cloud } from "lucide-react"
import Link from "next/link"
import { StoryReaderClient } from "@/components/story-reader-client"
import { GeminiEmbed } from "@/components/gemini-embed"

interface StoryPageProps {
  params: {
    id: string
  }
}

export default async function StoryPage({ params }: StoryPageProps) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  try {
    const res = await fetch(`${baseUrl}/api/stories/${params.id}`, {
      cache: 'no-store'
    })

    if (!res.ok) {
      notFound()
    }

    const data = await res.json()
    const story = data.story

    if (!story) {
      notFound()
    }

    // ✅ FIXED: Proper Gemini story detection
    // Check geminiSourceUrl field yang disimpan saat create Gemini story
    const isGeminiStory = !!story.geminiSourceUrl
    const geminiEmbedUrl = story.geminiEmbedUrl || story.geminiSourceUrl

    console.log('[Story Detail] Story loaded:', {
      id: story.id,
      title: story.title,
      isGeminiStory,
      geminiSourceUrl: story.geminiSourceUrl,
      geminiEmbedUrl: story.geminiEmbedUrl
    })

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Button asChild variant="ghost">
                <Link href="/stories" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Kembali ke Koleksi</span>
                </Link>
              </Button>

              <div className="flex items-center space-x-2">
                {isGeminiStory && (
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm mr-2">
                    <Cloud className="h-4 w-4" />
                    Gemini Storybook
                  </div>
                )}
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Bagikan
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Story Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isGeminiStory && geminiEmbedUrl ? (
            // ✅ Gemini Storybook View dengan iframe embed
            <GeminiEmbed
              geminiUrl={geminiEmbedUrl}
              title={story.title}
              description="Cerita dari Gemini Storybook"
            />
          ) : (
            // Regular Story Reader View (manual upload stories)
            <StoryReaderClient story={story} />
          )}
        </div>

        {/* Story Info */}
        <div className="max-w-4xl mx-auto px-4 py-8 border-t">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Tentang Cerita Ini</h2>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
              <div>
                <strong className="text-foreground">Penulis:</strong> {story.authorName}
              </div>
              <div>
                <strong className="text-foreground">Tanggal Dibuat:</strong>{" "}
                {new Date(story.createdAt).toLocaleDateString("id-ID")}
              </div>
              <div>
                <strong className="text-foreground">Tipe Cerita:</strong>{" "}
                {isGeminiStory ? "Gemini Storybook" : "Manual Upload"}
              </div>
              <div>
                <strong className="text-foreground">Status:</strong>{" "}
                {story.isPublished ? "Dipublikasikan" : "Draft"}
              </div>
              {!isGeminiStory && (
                <div>
                  <strong className="text-foreground">Bahasa Tersedia:</strong>{" "}
                  {Object.keys(story.content || {}).join(", ")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )

  } catch (error) {
    console.error('Error fetching story:', error)
    notFound()
  }
}