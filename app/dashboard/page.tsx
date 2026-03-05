"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, BookOpen, Eye, Edit, Trash2, MoreHorizontal, Upload, BarChart3, Cloud } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import type { Story } from "@/lib/types"

export default function DashboardPage() {
  const { user } = useAuth()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null)

  useEffect(() => {
    const fetchStories = async () => {
      if (!user?.id) return

      try {
        const response = await fetch(`/api/stories?authorId=${user.id}`)
        const data = await response.json()

        if (response.ok && Array.isArray(data.stories)) {
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
  const geminiStories = stories.filter((story) => story.gemini_source_url)
  const manualStories = stories.filter((story) => !story.gemini_source_url)

  const handleDeleteClick = (storyId: string) => {
    setStoryToDelete(storyId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!storyToDelete) return

    try {
      const response = await fetch(`/api/stories/${storyToDelete}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setStories(stories.filter((story) => story.id !== storyToDelete))
        setDeleteDialogOpen(false)
        setStoryToDelete(null)
      } else {
        alert('Gagal menghapus cerita')
      }
    } catch (error) {
      console.error('Error deleting story:', error)
      alert('Terjadi kesalahan saat menghapus cerita')
    }
  }

  const handleTogglePublish = async (storyId: string) => {
    const story = stories.find(s => s.id === storyId)
    if (!story) return

    try {
      const response = await fetch(`/api/stories/${storyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...story,
          isPublished: !story.isPublished
        })
      })

      if (response.ok) {
        setStories(stories.map((s) => 
          s.id === storyId ? { ...s, isPublished: !s.isPublished } : s
        ))
      } else {
        alert('Gagal mengubah status cerita')
      }
    } catch (error) {
      console.error('Error toggling publish:', error)
      alert('Terjadi kesalahan saat mengubah status cerita')
    }
  }

  const getStoryPreview = (story: Story) => {
    const indonesianContent = story.content.indonesian
    if (Array.isArray(indonesianContent)) {
      return (
        indonesianContent
          .map((page) => page.text)
          .join(" ")
          .substring(0, 100) + "..."
      )
    }
    return typeof indonesianContent === "string" ? indonesianContent.substring(0, 100) + "..." : ""
  }

  const isGeminiStory = (story: Story) => {
    return !!story.gemini_source_url
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Guru</h1>
        <p className="text-lg text-muted-foreground">Selamat datang, {user.name}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-5 gap-6 mb-8">
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
            <CardTitle className="text-sm font-medium">Gemini Import</CardTitle>
            <Cloud className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{geminiStories.length}</div>
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
          <TabsTrigger value="all">Semua ({stories.length})</TabsTrigger>
          <TabsTrigger value="published">Dipublikasikan ({publishedStories.length})</TabsTrigger>
          <TabsTrigger value="drafts">Draft ({draftStories.length})</TabsTrigger>
          <TabsTrigger value="gemini" className="gap-2">
            <Cloud className="h-4 w-4" />
            Gemini ({geminiStories.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <StoryList
            stories={stories}
            onDelete={handleDeleteClick}
            onTogglePublish={handleTogglePublish}
            getStoryPreview={getStoryPreview}
            isGeminiStory={isGeminiStory}
          />
        </TabsContent>

        <TabsContent value="published">
          <StoryList
            stories={publishedStories}
            onDelete={handleDeleteClick}
            onTogglePublish={handleTogglePublish}
            getStoryPreview={getStoryPreview}
            isGeminiStory={isGeminiStory}
          />
        </TabsContent>

        <TabsContent value="drafts">
          <StoryList
            stories={draftStories}
            onDelete={handleDeleteClick}
            onTogglePublish={handleTogglePublish}
            getStoryPreview={getStoryPreview}
            isGeminiStory={isGeminiStory}
          />
        </TabsContent>

        <TabsContent value="gemini">
          <StoryList
            stories={geminiStories}
            onDelete={handleDeleteClick}
            onTogglePublish={handleTogglePublish}
            getStoryPreview={getStoryPreview}
            isGeminiStory={isGeminiStory}
          />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Cerita</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus cerita ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface StoryListProps {
  stories: Story[]
  onDelete: (storyId: string) => void
  onTogglePublish: (storyId: string) => void
  getStoryPreview: (story: Story) => string
  isGeminiStory: (story: Story) => boolean
}

function StoryList({ stories, onDelete, onTogglePublish, getStoryPreview, isGeminiStory }: StoryListProps) {
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

  const getStoryImage = (story: Story) => {
    return story.coverImage || story.illustrations?.[0] || "/placeholder.svg"
  }

  return (
    <div className="grid gap-6">
      {stories.map((story) => (
        <Card key={story.id} className="overflow-hidden">
          <div className="flex">
            {/* Story Thumbnail */}
            <div className="w-32 h-24 bg-muted flex-shrink-0 relative">
              <img
                src={getStoryImage(story)}
                alt={story.title}
                className="w-full h-full object-cover"
              />
              {isGeminiStory(story) && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent flex items-center justify-center">
                  <Cloud className="h-5 w-5 text-blue-100" />
                </div>
              )}
            </div>

            {/* Story Info */}
            <div className="flex-1 p-6 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-foreground">{story.title}</h3>
                  <Badge variant={story.isPublished ? "default" : "secondary"}>
                    {story.isPublished ? "Dipublikasikan" : "Draft"}
                  </Badge>
                  {isGeminiStory(story) && (
                    <Badge className="bg-blue-500/90 flex items-center gap-1">
                      <Cloud className="h-3 w-3" />
                      Gemini
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{getStoryPreview(story)}</p>

                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span>Bahasa: {Object.keys(story.content).length}</span>
                  {isGeminiStory(story) && (
                    <span className="text-blue-600">📚 Dari Gemini Storybook</span>
                  )}
                </div>
              </div>

              {/* Actions Dropdown */}
              <div className="flex-shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Buka menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href={`/stories/${story.id}`} className="cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" />
                        <span>Lihat</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/edit/${story.id}`} className="cursor-pointer">
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => onTogglePublish(story.id)}
                      className="cursor-pointer"
                    >
                      {story.isPublished ? (
                        <>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Jadikan Draft</span>
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          <span>Publikasikan</span>
                        </>
                      )}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => onDelete(story.id)}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Hapus</span>
                    </DropdownMenuItem>
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