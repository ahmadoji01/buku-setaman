"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen, Clock, User, Cloud } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Story {
  id: string
  title: string
  coverImage?: string
  content: Record<string, any>
  authorId: string
  authorName: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
  illustrations?: string[]
  gemini_source_url?: string | null
}

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [filterMode, setFilterMode] = useState<'all' | 'gemini' | 'manual'>('all')

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await fetch("/api/stories?published=true")
        const data = await res.json()
        setStories(data.stories || [])
      } catch (error) {
        console.error("Error fetching stories:", error)
        setStories([])
      } finally {
        setLoading(false)
      }
    }

    fetchStories()
  }, [])

  const getStoryPreview = (story: Story) => {
    const content = story.content?.indonesian
    if (Array.isArray(content)) {
      return content.map((page: any) => page.text).join(" ").substring(0, 120) + "..."
    }
    return typeof content === "string" ? content.substring(0, 120) + "..." : ""
  }

  const getStoryImage = (story: Story) => {
    return story.coverImage || story.illustrations?.[0] || "/placeholder.svg"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID")
  }

  const isGeminiStory = (story: Story) => {
    return !!story.gemini_source_url
  }

  // Filter stories
  const filteredStories = stories.filter(story => {
    if (filterMode === 'gemini') return isGeminiStory(story)
    if (filterMode === 'manual') return !isGeminiStory(story)
    return true
  })

  const geminiCount = stories.filter(isGeminiStory).length
  const manualCount = stories.length - geminiCount

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <p className="text-muted-foreground">Memuat cerita...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Koleksi Cerita</h1>
        <p className="text-lg text-muted-foreground">
          Jelajahi berbagai cerita menarik dalam bahasa Indonesia, Sunda, dan Inggris
        </p>
      </div>

      {/* Filter Tabs */}
      {stories.length > 0 && (
        <div className="flex gap-2 mb-8 flex-wrap">
          <Button
            variant={filterMode === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterMode('all')}
          >
            Semua Cerita ({stories.length})
          </Button>
          <Button
            variant={filterMode === 'gemini' ? 'default' : 'outline'}
            onClick={() => setFilterMode('gemini')}
            className="gap-2"
          >
            <Cloud className="h-4 w-4" />
            Gemini ({geminiCount})
          </Button>
          <Button
            variant={filterMode === 'manual' ? 'default' : 'outline'}
            onClick={() => setFilterMode('manual')}
          >
            Manual ({manualCount})
          </Button>
        </div>
      )}

      {filteredStories.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {stories.length === 0 ? 'Belum Ada Cerita' : `Tidak ada cerita ${filterMode}`}
          </h3>
          <p className="text-muted-foreground">
            {stories.length === 0 
              ? 'Cerita akan muncul di sini setelah guru mengunggahnya.' 
              : 'Coba filter yang berbeda untuk melihat cerita lainnya.'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => (
            <Card key={story.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
              {/* Story Image */}
              <div className="aspect-video bg-muted relative overflow-hidden">
                <img
                  src={getStoryImage(story)}
                  alt={story.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg"
                  }}
                />
                <div className="absolute top-2 left-2 flex gap-2">
                  <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                    <BookOpen className="h-3 w-3 mr-1" />
                    Cerita
                  </Badge>
                </div>
                
                {/* Gemini Badge */}
                {isGeminiStory(story) && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-blue-500/90 hover:bg-blue-600 flex items-center gap-1">
                      <Cloud className="h-3 w-3" />
                      Gemini
                    </Badge>
                  </div>
                )}
              </div>

              {/* Story Header */}
              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">{story.title}</CardTitle>
                <CardDescription className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    {story.authorName}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(story.createdAt)}
                  </span>
                </CardDescription>
              </CardHeader>

              {/* Story Content */}
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{getStoryPreview(story)}</p>

                {/* Languages */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {Object.keys(story.content || {}).map((lang) => (
                    <Badge key={lang} variant="outline" className="text-xs">
                      {lang === "indonesian" && "🇮🇩 ID"}
                      {lang === "sundanese" && "🗣️ SU"}
                      {lang === "english" && "🇬🇧 EN"}
                    </Badge>
                  ))}
                </div>

                {/* Gemini Info */}
                {isGeminiStory(story) && (
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-2 mb-4">
                    <p className="text-xs text-blue-900 dark:text-blue-100">
                      📚 Dari Gemini Storybook
                    </p>
                  </div>
                )}

                <Button asChild className="w-full">
                  <Link href={`/stories/${story.id}`}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Baca Cerita
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}