"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, BookOpen, Eye, Edit, Trash2, MoreHorizontal, Upload, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import type { Story } from "@/lib/types"

export default function DashboardPage() {
  const { user } = useAuth()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStories = async () => {
      if (!user?.id) return

      try {
        const response = await fetch(`/api/stories?authorId=${user.id}`)
        const data = await response.json()

        if (response.ok && Array.isArray(data.stories)) {
          // Ensure stories have the expected structure
          const formattedStories = data.stories.map((story: any) => ({
            ...story,
            illustrations: story.illustrations || [],
            audioFiles: story.audioFiles || {}
          }))
          setStories(formattedStories)
        } else {
          console.error('Failed to fetch stories:', data.error)
          setStories([])
        }
      } catch (error) {
        console.error('Error fetching stories:', error)
        setStories([])
      } finally {
        setLoading(false)
      }
    }

    fetchStories()
  }, [user?.id])

  if (!user || user.role !== "teacher") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Akses Ditolak</h1>
          <p className="text-muted-foreground">Anda harus masuk sebagai guru untuk mengakses dashboard ini.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Memuat cerita...</p>
        </div>
      </div>
    )
  }

  const publishedStories = stories.filter((story) => story.isPublished)
  const draftStories = stories.filter((story) => !story.isPublished)

  const handleDeleteStory = (storyId: string) => {
    setStories(stories.filter((story) => story.id !== storyId))
  }

  const handleTogglePublish = (storyId: string) => {
    setStories(stories.map((story) => (story.id === storyId ? { ...story, isPublished: !story.isPublished } : story)))
  }

  const getStoryPreview = (story: Story) => {
    const content = story.content.indonesian
    if (Array.isArray(content)) {
      // New format: array of StoryPage objects
      return (
        content
          .map((page) => page.text)
          .join(" ")
          .substring(0, 100) + "..."
      )
    }
    // Old format: string
    return typeof content === "string" ? content.substring(0, 100) + "..." : ""
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Guru</h1>
        <p className="text-lg text-muted-foreground">Selamat datang, {user.name}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cerita</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stories.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dipublikasikan</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{publishedStories.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{draftStories.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pembaca</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Button asChild size="lg">
          <Link href="/dashboard/create">
            <Plus className="mr-2 h-5 w-5" />
            Buat Cerita Baru
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/dashboard/bulk-upload">
            <Upload className="mr-2 h-5 w-5" />
            Upload Massal
          </Link>
        </Button>
      </div>

      {/* Stories Management */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">Semua Cerita ({stories.length})</TabsTrigger>
          <TabsTrigger value="published">Dipublikasikan ({publishedStories.length})</TabsTrigger>
          <TabsTrigger value="drafts">Draft ({draftStories.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <StoryList
            stories={stories}
            onDelete={handleDeleteStory}
            onTogglePublish={handleTogglePublish}
            getStoryPreview={getStoryPreview}
          />
        </TabsContent>

        <TabsContent value="published">
          <StoryList
            stories={publishedStories}
            onDelete={handleDeleteStory}
            onTogglePublish={handleTogglePublish}
            getStoryPreview={getStoryPreview}
          />
        </TabsContent>

        <TabsContent value="drafts">
          <StoryList
            stories={draftStories}
            onDelete={handleDeleteStory}
            onTogglePublish={handleTogglePublish}
            getStoryPreview={getStoryPreview}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface StoryListProps {
  stories: Story[]
  onDelete: (storyId: string) => void
  onTogglePublish: (storyId: string) => void
  getStoryPreview: (story: Story) => string
}

function StoryList({ stories, onDelete, onTogglePublish, getStoryPreview }: StoryListProps) {
  if (stories.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Belum Ada Cerita</h3>
        <p className="text-muted-foreground mb-4">Mulai dengan membuat cerita pertama Anda.</p>
        <Button asChild>
          <Link href="/dashboard/create">
            <Plus className="mr-2 h-4 w-4" />
            Buat Cerita Baru
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {stories.map((story) => (
        <Card key={story.id} className="overflow-hidden">
          <div className="flex">
            {/* Story Thumbnail */}
            <div className="w-32 h-24 bg-muted flex-shrink-0">
              <img
                src={story.illustrations[0] || "/placeholder.svg"}
                alt={story.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Story Info */}
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">{story.title}</h3>
                    <Badge variant={story.isPublished ? "default" : "secondary"}>
                      {story.isPublished ? "Dipublikasikan" : "Draft"}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{getStoryPreview(story)}</p>

                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>Bahasa: {Object.keys(story.content).length}</span>
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/stories/${story.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Lihat
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/edit/${story.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onTogglePublish(story.id)}>
                      {story.isPublished ? (
                        <>
                          <Edit className="mr-2 h-4 w-4" />
                          Jadikan Draft
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Publikasikan
                        </>
                      )}
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Cerita</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus cerita "{story.title}"? Tindakan ini tidak dapat
                            dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(story.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
