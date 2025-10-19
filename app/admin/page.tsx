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
import {
  Plus,
  Users,
  BookOpen,
  GraduationCap,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  FileText,
  Presentation,
  File,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import type { Module, User, Story } from "@/lib/types"

export default function AdminPage() {
  const { user } = useAuth()
  const [modules, setModules] = useState<Module[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [usersRes, modulesRes, storiesRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/modules"),
        fetch("/api/stories"),
      ])

      if (!usersRes.ok) {
        throw new Error("Failed to fetch users")
      }
      if (!modulesRes.ok) {
        throw new Error("Failed to fetch modules")
      }
      if (!storiesRes.ok) {
        throw new Error("Failed to fetch stories")
      }

      const usersData = await usersRes.json()
      const modulesData = await modulesRes.json()
      const storiesData = await storiesRes.json()

      setUsers(usersData.users)
      setModules(modulesData.modules)
      setStories(storiesData.stories)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Akses Ditolak</h1>
          <p className="text-muted-foreground">Anda harus masuk sebagai admin untuk mengakses panel ini.</p>
        </div>
      </div>
    )
  }

  const handleDeleteModule = async (moduleId: string) => {
    try {
      const response = await fetch(`/api/admin/modules?id=${moduleId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete module")
      }

      setModules(modules.filter((module) => module.id !== moduleId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete module")
      console.error("Error deleting module:", err)
    }
  }

  const teachers = users.filter((u) => u.role === "teacher")
  const publishedStories = stories.filter((s) => s.isPublished)

  const getModuleIcon = (type: Module["type"]) => {
    switch (type) {
      case "ppt":
        return <Presentation className="h-4 w-4" />
      case "pdf":
        return <File className="h-4 w-4" />
      case "blog":
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getModuleTypeBadge = (type: Module["type"]) => {
    const variants = {
      ppt: "bg-blue-100 text-blue-800",
      pdf: "bg-red-100 text-red-800",
      blog: "bg-green-100 text-green-800",
    }

    const labels = {
      ppt: "PowerPoint",
      pdf: "PDF",
      blog: "Blog Post",
    }

    return (
      <Badge className={variants[type]}>
        {getModuleIcon(type)}
        <span className="ml-1">{labels[type]}</span>
      </Badge>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Admin Panel</h1>
        <p className="text-lg text-muted-foreground">Kelola pengguna, modul pelatihan, dan sistem</p>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="mb-6 border-destructive bg-destructive/10">
          <CardContent className="p-4">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">{teachers.length} guru aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cerita</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stories.length}</div>
            <p className="text-xs text-muted-foreground">{publishedStories.length} dipublikasikan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modul Pelatihan</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modules.length}</div>
            <p className="text-xs text-muted-foreground">Untuk guru</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktivitas Hari Ini</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Cerita dibaca</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="modules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="modules">Modul Pelatihan</TabsTrigger>
          <TabsTrigger value="users">Pengguna</TabsTrigger>
          <TabsTrigger value="stories">Cerita</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Modul Pelatihan</h2>
              <p className="text-muted-foreground">Kelola modul pelatihan untuk guru</p>
            </div>
            <Button asChild>
              <Link href="/admin/modules/create">
                <Plus className="mr-2 h-4 w-4" />
                Buat Modul Baru
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Memuat modul...</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {modules.length > 0 ? (
                modules.map((module) => (
                  <Card key={module.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{module.title}</h3>
                            {getModuleTypeBadge(module.type)}
                          </div>
                          <p className="text-muted-foreground mb-3 line-clamp-2">{module.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>Dibuat: {new Date(module.createdAt).toLocaleDateString("id-ID")}</span>
                            <span>Diperbarui: {new Date(module.updatedAt).toLocaleDateString("id-ID")}</span>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/modules/${module.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/modules/edit/${module.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
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
                                  <AlertDialogTitle>Hapus Modul</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Apakah Anda yakin ingin menghapus modul "{module.title}"? Tindakan ini tidak dapat
                                    dibatalkan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteModule(module.id)}
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
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Belum Ada Modul</h3>
                  <p className="text-muted-foreground mb-4">Mulai dengan membuat modul pelatihan pertama.</p>
                  <Button asChild>
                    <Link href="/admin/modules/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Buat Modul Baru
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Manajemen Pengguna</h2>
              <p className="text-muted-foreground">Kelola akun guru dan admin</p>
            </div>
            <Button asChild>
              <Link href="/admin/users/create">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Pengguna
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Memuat pengguna...</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {users.length > 0 ? (
                users.map((userData) => (
                  <Card key={userData.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">{userData.name}</h3>
                            <p className="text-sm text-muted-foreground">{userData.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={userData.role === "admin" ? "default" : "secondary"}>
                            {userData.role === "admin" ? "Admin" : "Guru"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(userData.createdAt).toLocaleDateString("id-ID")}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Belum Ada Pengguna</h3>
                  <p className="text-muted-foreground mb-4">Mulai dengan menambahkan pengguna pertama.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stories" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Semua Cerita</h2>
            <p className="text-muted-foreground">Pantau cerita yang dibuat oleh guru</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Memuat cerita...</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {stories.length > 0 ? (
                stories.map((story) => (
                  <Card key={story.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                            {story.coverImage ? (
                              <img
                                src={story.coverImage}
                                alt={story.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-muted-foreground/10">
                                <BookOpen className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">{story.title}</h3>
                            <p className="text-sm text-muted-foreground">Oleh {story.authorName}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={story.isPublished ? "default" : "secondary"}>
                            {story.isPublished ? "Dipublikasikan" : "Draft"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(story.createdAt).toLocaleDateString("id-ID")}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Belum Ada Cerita</h3>
                  <p className="text-muted-foreground">Cerita akan muncul di sini setelah guru membuat cerita baru.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}