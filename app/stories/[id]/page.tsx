import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Share2 } from "lucide-react"
import Link from "next/link"
import { StoryReaderClient } from "@/components/story-reader-client"

interface StoryPageProps {
  params: {
    id: string
  }
}

export default async function StoryPage({ params }: StoryPageProps) {
  // Fetch the story from the API
  const res = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/stories/${params.id}`, {
    cache: 'no-store' // Ensure fresh data
  })

  if (!res.ok) {
    notFound()
  }

  const data = await res.json()
  const story = data.story

  if (!story) {
    notFound()
  }

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
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Bagikan
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Story Reader */}
      <StoryReaderClient story={story} />

      {/* Story Info */}
      <div className="max-w-4xl mx-auto px-4 py-8 border-t">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Tentang Cerita Ini</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
            <div>
              <strong className="text-foreground">Penulis:</strong> {story.authorName}
            </div>
            <div>
              <strong className="text-foreground">Tanggal Dibuat:</strong> {new Date(story.createdAt).toLocaleDateString("id-ID")}
            </div>
            <div>
              <strong className="text-foreground">Bahasa Tersedia:</strong> {Object.keys(story.content || {}).join(", ")}
            </div>
            <div>
              <strong className="text-foreground">Status:</strong> {story.isPublished ? "Dipublikasikan" : "Draft"}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
