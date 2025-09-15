import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, FileText, Presentation, File, Clock, User } from "lucide-react"
import Link from "next/link"
import { mockModules } from "@/lib/mock-data"

interface ModulePageProps {
  params: {
    id: string
  }
}

export default function ModulePage({ params }: ModulePageProps) {
  const module = mockModules.find((m) => m.id === params.id)

  if (!module) {
    notFound()
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/modules">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Modul
            </Link>
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{module.title}</h1>
                {getModuleTypeBadge(module.type)}
              </div>
              <p className="text-lg text-muted-foreground mb-4">{module.description}</p>

              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Dibuat: {module.createdAt.toLocaleDateString("id-ID")}
                </span>
                <span className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  Admin
                </span>
              </div>
            </div>

            {module.fileUrl && (
              <Button asChild>
                <Link href={module.fileUrl} target="_blank">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {module.type === "blog" ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Konten Modul
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-lg max-w-none">
                <div className="whitespace-pre-wrap text-foreground leading-relaxed">{module.content}</div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {getModuleIcon(module.type)}
                <span className="ml-2">File Modul</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                  {getModuleIcon(module.type)}
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  File {module.type === "ppt" ? "PowerPoint" : "PDF"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  Klik tombol download untuk mengunduh dan membuka file modul
                </p>
                {module.fileUrl && (
                  <Button asChild size="lg">
                    <Link href={module.fileUrl} target="_blank">
                      <Download className="mr-2 h-5 w-5" />
                      Download File
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Informasi Tambahan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <strong className="text-foreground">Jenis Modul:</strong>
                <p className="text-muted-foreground mt-1">
                  {module.type === "blog" && "Blog Post - Konten teks yang dapat dibaca langsung"}
                  {module.type === "ppt" && "PowerPoint - Presentasi interaktif untuk pembelajaran"}
                  {module.type === "pdf" && "PDF Document - Dokumen yang dapat diunduh dan dibaca"}
                </p>
              </div>
              <div>
                <strong className="text-foreground">Target Pengguna:</strong>
                <p className="text-muted-foreground mt-1">Guru dan tenaga pendidik</p>
              </div>
              <div>
                <strong className="text-foreground">Terakhir Diperbarui:</strong>
                <p className="text-muted-foreground mt-1">{module.updatedAt.toLocaleDateString("id-ID")}</p>
              </div>
              <div>
                <strong className="text-foreground">Status:</strong>
                <p className="text-muted-foreground mt-1">Aktif dan tersedia</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
