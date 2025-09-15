"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GraduationCap, FileText, Presentation, File, Clock, User, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { mockModules } from "@/lib/mock-data"

export default function ModulesPage() {
  const { user } = useAuth()

  // Only teachers can access modules
  if (!user || user.role === "public") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Modul pelatihan hanya tersedia untuk guru. Silakan{" "}
            <Link href="/login" className="underline text-primary">
              masuk
            </Link>{" "}
            dengan akun guru untuk mengakses konten ini.
          </AlertDescription>
        </Alert>
      </div>
    )
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
        {labels[type as keyof typeof labels] || "Unknown"}
      </Badge>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Modul Pelatihan</h1>
        <p className="text-lg text-muted-foreground">
          Akses materi pelatihan dan panduan untuk meningkatkan keterampilan mengajar
        </p>
      </div>

      {/* Welcome Message for Teachers */}
      {user.role === "teacher" && (
        <Alert className="mb-8">
          <GraduationCap className="h-4 w-4" />
          <AlertDescription>
            Selamat datang, {user.name}! Berikut adalah modul pelatihan yang tersedia untuk Anda. Gunakan materi ini
            untuk meningkatkan keterampilan dalam membuat cerita edukatif.
          </AlertDescription>
        </Alert>
      )}

      {/* Modules Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockModules.map((module) => (
          <Card key={module.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getModuleIcon(module.type)}
                  <CardTitle className="text-lg line-clamp-2">{module.title}</CardTitle>
                </div>
                {getModuleTypeBadge(module.type)}
              </div>
              <CardDescription className="line-clamp-3">{module.description}</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* Module Preview */}
                <div className="text-sm text-muted-foreground line-clamp-3">{module.content.substring(0, 150)}...</div>

                {/* Module Meta */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {module.createdAt.toLocaleDateString("id-ID")}
                  </span>
                  <span className="flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    Admin
                  </span>
                </div>

                {/* Action Button */}
                <Button asChild className="w-full">
                  <Link href={`/modules/${module.id}`}>
                    {getModuleIcon(module.type)}
                    <span className="ml-2">Buka Modul</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mockModules.length === 0 && (
        <div className="text-center py-12">
          <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Belum Ada Modul</h3>
          <p className="text-muted-foreground">Modul pelatihan akan muncul di sini setelah admin menambahkannya.</p>
        </div>
      )}
    </div>
  )
}
