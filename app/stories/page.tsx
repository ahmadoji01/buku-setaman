import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Clock, User } from "lucide-react"
import { getPublishedStories } from "@/lib/mock-data"

export default function StoriesPage() {
  const stories = getPublishedStories()

  const getStoryPreview = (story: any) => {
    const content = story.content.indonesian
    if (Array.isArray(content)) {
      // New format: array of StoryPage objects
      return (
        content
          .map((page) => page.text)
          .join(" ")
          .substring(0, 120) + "..."
      )
    }
    // Old format: string
    return typeof content === "string" ? content.substring(0, 120) + "..." : ""
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Koleksi Cerita</h1>
        <p className="text-lg text-muted-foreground">
          Jelajahi berbagai cerita menarik dalam bahasa Indonesia, Sunda, dan Inggris
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.map((story) => (
          <Card key={story.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
            <div className="aspect-video bg-muted relative overflow-hidden">
              <img
                src={story.illustrations[0] || "/placeholder.svg"}
                alt={story.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Cerita
                </Badge>
              </div>
            </div>

            <CardHeader>
              <CardTitle className="text-lg line-clamp-2">{story.title}</CardTitle>
              <CardDescription className="flex items-center space-x-4 text-sm">
                <span className="flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  {story.authorName}
                </span>
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {story.createdAt.toLocaleDateString("id-ID")}
                </span>
              </CardDescription>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{getStoryPreview(story)}</p>

              {/* Available Languages */}
              <div className="flex flex-wrap gap-1 mb-4">
                {Object.keys(story.content).map((lang) => (
                  <Badge key={lang} variant="outline" className="text-xs">
                    {lang === "indonesian" && "ID"}
                    {lang === "sundanese" && "SU"}
                    {lang === "english" && "EN"}
                  </Badge>
                ))}
              </div>

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

      {stories.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Belum Ada Cerita</h3>
          <p className="text-muted-foreground">Cerita akan muncul di sini setelah guru mengunggahnya.</p>
        </div>
      )}
    </div>
  )
}
