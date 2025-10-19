"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen, Users, Sparkles, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Story {
  id: string
  title: string
  coverImage?: string
  content: Record<string, any>
  authorName: string
  illustrations?: string[]
}

export default function HomePage() {
  const [stories, setStories] = useState<Story[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch published stories
        const storiesRes = await fetch("/api/stories?published=true")
        const storiesData = await storiesRes.json()
        setStories((storiesData.stories || []).slice(0, 6))

        // Check authentication
        const authRes = await fetch("/api/auth/me")
        setIsAuthenticated(authRes.ok)
      } catch (error) {
        console.error("Error fetching data:", error)
        setStories([])
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getStoryPreview = (story: Story) => {
    const content = story.content?.indonesian
    if (Array.isArray(content)) {
      return content.map((page: any) => page.text).join(" ").substring(0, 150) + "..."
    }
    return typeof content === "string" ? content.substring(0, 150) + "..." : ""
  }

  const getStoryImage = (story: Story) => {
    return story.coverImage || story.illustrations?.[0] || "/placeholder.svg"
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

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Memuat cerita...</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-8">
              {stories.map((story) => (
                <Card key={story.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <img
                      src={getStoryImage(story)}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg"
                      }}
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
          </>
        )}
      </section>
    </div>
  )
}