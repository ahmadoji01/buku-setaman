"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, Upload, FileText, Presentation, File, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import type { Module } from "@/lib/types"

export default function CreateModulePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "blog" as Module["type"],
    content: "",
  })

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Akses Ditolak</h1>
          <p className="text-muted-foreground">Anda harus masuk sebagai admin untuk membuat modul.</p>
        </div>
      </div>
    )
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = {
        ppt: [
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ],
        pdf: ["application/pdf"],
      }

      const isValidType =
        formData.type === "blog" || allowedTypes[formData.type as keyof typeof allowedTypes]?.includes(file.type)

      if (!isValidType) {
        alert("Tipe file tidak sesuai dengan jenis modul yang dipilih")
        return
      }

      setUploadedFile(file)
    }
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      alert("Judul dan deskripsi wajib diisi")
      return
    }

    if (formData.type === "blog" && !formData.content.trim()) {
      alert("Konten blog wajib diisi")
      return
    }

    if ((formData.type === "ppt" || formData.type === "pdf") && !uploadedFile) {
      alert("File wajib diupload untuk jenis modul ini")
      return
    }

    setIsLoading(true)

    // Simulate save operation
    setTimeout(() => {
      const newModule: Module = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        type: formData.type,
        content: formData.content,
        fileUrl: uploadedFile ? `/uploads/${uploadedFile.name}` : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      console.log("Module saved:", newModule)
      setIsLoading(false)
      router.push("/admin")
    }, 1000)
  }

  const getModuleTypeIcon = (type: Module["type"]) => {
    switch (type) {
      case "ppt":
        return <Presentation className="h-4 w-4" />
      case "pdf":
        return <File className="h-4 w-4" />
      case "blog":
        return <FileText className="h-4 w-4" />
    }
  }

  const getModuleTypeDescription = (type: Module["type"]) => {
    switch (type) {
      case "ppt":
        return "Upload file PowerPoint untuk presentasi interaktif"
      case "pdf":
        return "Upload dokumen PDF untuk materi bacaan"
      case "blog":
        return "Tulis konten dalam format blog post dengan editor teks"
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Admin Panel
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-2">Buat Modul Pelatihan</h1>
        <p className="text-lg text-muted-foreground">Buat modul pelatihan baru untuk guru</p>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
            <CardDescription>Masukkan informasi dasar modul pelatihan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Judul Modul *</Label>
              <Input
                id="title"
                placeholder="Masukkan judul modul..."
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="description">Deskripsi *</Label>
              <Textarea
                id="description"
                placeholder="Jelaskan tujuan dan isi modul..."
                className="min-h-[100px]"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Module Type */}
        <Card>
          <CardHeader>
            <CardTitle>Jenis Modul</CardTitle>
            <CardDescription>Pilih format modul yang akan dibuat</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="type">Jenis Modul *</Label>
              <Select value={formData.type} onValueChange={(value: Module["type"]) => handleInputChange("type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blog">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Blog Post</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ppt">
                    <div className="flex items-center space-x-2">
                      <Presentation className="h-4 w-4" />
                      <span>PowerPoint</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center space-x-2">
                      <File className="h-4 w-4" />
                      <span>PDF Document</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center space-x-2">
                  {getModuleTypeIcon(formData.type)}
                  <span>{getModuleTypeDescription(formData.type)}</span>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Content Section */}
        {formData.type === "blog" ? (
          <Card>
            <CardHeader>
              <CardTitle>Konten Blog</CardTitle>
              <CardDescription>Tulis konten modul dalam format blog post</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="content">Konten *</Label>
                <Textarea
                  id="content"
                  placeholder="Tulis konten modul pelatihan..."
                  className="min-h-[300px]"
                  value={formData.content}
                  onChange={(e) => handleInputChange("content", e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Gunakan format Markdown untuk styling teks (bold, italic, list, dll.)
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>
                Upload file {formData.type === "ppt" ? "PowerPoint" : "PDF"} untuk modul pelatihan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  {getModuleTypeIcon(formData.type)}
                  <div className="mt-4 space-y-2">
                    <p className="text-lg font-medium">Upload file {formData.type === "ppt" ? "PowerPoint" : "PDF"}</p>
                    <p className="text-sm text-muted-foreground">
                      Maksimal 50MB, format {formData.type === "ppt" ? ".ppt, .pptx" : ".pdf"}
                    </p>
                    <div>
                      <input
                        type="file"
                        accept={formData.type === "ppt" ? ".ppt,.pptx" : ".pdf"}
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <Button asChild variant="outline">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <Upload className="mr-2 h-4 w-4" />
                          Pilih File
                        </label>
                      </Button>
                    </div>
                  </div>
                </div>

                {uploadedFile && (
                  <div className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/50">
                    {getModuleTypeIcon(formData.type)}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadedFile(null)}
                      className="text-destructive hover:text-destructive"
                    >
                      Hapus
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleSave} disabled={isLoading} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Menyimpan..." : "Simpan Modul"}
          </Button>
          <Button asChild variant="outline" className="flex-1 bg-transparent">
            <Link href="/admin">Batal</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
