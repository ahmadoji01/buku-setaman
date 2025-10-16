import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users, Sparkles, Globe } from "lucide-react"
import { getPublishedStories } from "@/lib/mock-data"
import { getDatabaseService } from "@/lib/db-service"

export default async function HomePage() {
  const dbService = getDatabaseService()
  const stories = await dbService.getPublishedStoriesFromDB(6) // Show last 6 inserted stories from database

  // Check if user is authenticated by calling the auth API
  const checkAuth = async () => {
    try {
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/me`, {
        headers: {
          'Cookie': 'user-session=dummy' // This will be replaced by actual cookie in real request
        }
      })
      return response.ok
    } catch {
      return false
    }
  }

  const isAuthenticated = await checkAuth()

  const getStoryPreview = (story: any) => {
    const content = story.content.indonesian
    if (Array.isArray(content)) {
      // New format: array of StoryPage objects
      return (
        content
          .map((page) => page.text)
          .join(" ")
          .substring(0, 150) + "..."
      )
    }
    // Old format: string
    return typeof content === "string" ? content.substring(0, 150) + "..." : ""
  }

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
            Selamat Datang di <span className="text-primary">Buku Setaman</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 text-pretty">
            Platform cerita edukatif dengan teknologi AI yang membantu guru membuat cerita interaktif dalam bahasa
            Indonesia, Sunda, dan Inggris
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/stories">
                <BookOpen className="mr-2 h-5 w-5" />
                Jelajahi Cerita
              </Link>
            </Button>
            {!isAuthenticated && (
              <Button asChild variant="outline" size="lg" className="text-lg px-8 bg-transparent">
                <Link href="/login">
                  <Users className="mr-2 h-5 w-5" />
                  Masuk sebagai Guru/Admin
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Fitur Unggulan</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Teknologi terdepan untuk pengalaman membaca yang lebih menarik
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Ilustrasi AI</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Teknologi AI menghasilkan ilustrasi menarik secara otomatis berdasarkan cerita yang Anda buat
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-secondary" />
              </div>
              <CardTitle>Multi Bahasa</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Dukungan untuk Bahasa Indonesia, Basa Sunda, dan Bahasa Inggris dalam satu platform
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>Pembaca Interaktif</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Pengalaman membaca dengan animasi halaman, audio narasi, dan fitur bookmark
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Featured Stories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Cerita Terbaru</h2>
          <p className="text-lg text-muted-foreground">Jelajahi cerita-cerita menarik dari para guru</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {stories.map((story) => (
            <Card key={story.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-muted relative">
                <img
                  src={story.illustrations[0] || "/placeholder.svg"}
                  alt={story.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{story.title}</CardTitle>
                <CardDescription>Oleh {story.authorName}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{getStoryPreview(story)}</p>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href={`/stories/${story.id}`}>Baca Cerita</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button asChild variant="outline" size="lg">
            <Link href="/stories">Lihat Semua Cerita</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
