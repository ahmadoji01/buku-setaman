"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Plus, FileText, Presentation, File, MoreHorizontal, Edit, Trash2, Eye, ArrowLeft, GraduationCap } from "lucide-react"
import { useAuth } from "@/lib/auth"

interface Module {
  id: string
  title: string
  description: string
  type: "blog" | "ppt" | "pdf"
  content: string
  fileUrl?: string
  createdAt: string
  updatedAt: string
}

export default function AdminModulesPage() {
  const { user } = useAuth()
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await fetch("/api/admin/modules")
        const data = await response.json()
        setModules(data.modules || [])
      } catch (error) {
        console.error("Error fetching modules:", error)
        setModules([])
      } finally {
        setLoading(false)
      }
    }

    fetchModules()
  }, [])

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Akses Ditolak</h1>
          <p className="text-muted-foreground">Anda harus masuk sebagai admin untuk mengelola modul.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Memuat modul...</p>
        </div>
      </div>
    )
  }

  const handleDeleteModule = async (moduleId: string) => {
    try {
      const response = await fetch(`/api/admin/modules?id=${moduleId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setModules(modules.filter((m) => m.id !== moduleId))
      }
    } catch (error) {
      console.error("Error deleting module:", error)
    }
  }

  const getModuleIcon = (type: string) => {
    switch (type) {
      case "ppt":
        return <Presentation className="h-5 w-5 text-blue-600" />
      case "pdf":
        return <File className="h-5 w-5 text-red-600" />
      case "blog":
        return <FileText className="h-5 w-5 text-green-600" />
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getModuleTypeBadge = (type: string) => {
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
      <Badge className={variants[type as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {getModuleIcon(type)}
        <span className="ml-1">{labels[type as keyof typeof labels] || "Unknown"}</span>
      </Badge>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Admin Panel
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Modul Pelatihan</h1>
            <p className="text-lg text-muted-foreground">Kelola modul pelatihan untuk guru</p>
          </div>
          <Button asChild>
            <Link href="/admin/modules/create">
              <Plus className="mr-2 h-4 w-4" />
              Buat Modul Baru
            </Link>
          </Button>
        </div>
      </div>

      {modules.length === 0 ? (
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
      ) : (
        <div className="grid gap-6">
          {modules.map((module) => (
            <Card key={module.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getModuleIcon(module.type)}
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
          ))}
        </div>
      )}
    </div>
  )
}