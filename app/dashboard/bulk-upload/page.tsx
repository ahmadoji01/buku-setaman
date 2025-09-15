"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Upload, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"

interface UploadFile {
  id: string
  name: string
  size: number
  status: "pending" | "processing" | "success" | "error"
  error?: string
}

export default function BulkUploadPage() {
  const { user } = useAuth()
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    const newFiles: UploadFile[] = selectedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      status: "pending",
    }))

    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  if (!user || user.role !== "teacher") {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Akses Ditolak</h1>
          <p className="text-muted-foreground">Anda harus masuk sebagai guru untuk mengakses fitur ini.</p>
        </div>
      </div>
    )
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate bulk upload process
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Update file status to processing
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "processing" } : f)))

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Simulate success/error (90% success rate)
      const isSuccess = Math.random() > 0.1

      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? {
                ...f,
                status: isSuccess ? "success" : "error",
                error: isSuccess ? undefined : "Format file tidak didukung",
              }
            : f,
        ),
      )

      // Update progress
      setUploadProgress(((i + 1) / files.length) * 100)
    }

    setIsUploading(false)
  }

  const handleRemoveFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const handleClearAll = () => {
    setFiles([])
    setUploadProgress(0)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusIcon = (status: UploadFile["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "processing":
        return <AlertCircle className="h-4 w-4 text-yellow-500 animate-spin" />
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: UploadFile["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Berhasil</Badge>
      case "error":
        return <Badge variant="destructive">Gagal</Badge>
      case "processing":
        return <Badge className="bg-yellow-100 text-yellow-800">Memproses</Badge>
      default:
        return <Badge variant="secondary">Menunggu</Badge>
    }
  }

  const successCount = files.filter((f) => f.status === "success").length
  const errorCount = files.filter((f) => f.status === "error").length

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-2">Upload Massal</h1>
        <p className="text-lg text-muted-foreground">Upload beberapa cerita sekaligus dalam format yang didukung</p>
      </div>

      <div className="space-y-6">
        {/* Upload Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Petunjuk Upload</CardTitle>
            <CardDescription>Ikuti panduan berikut untuk upload yang berhasil</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <p>Format yang didukung: .txt, .docx, .pdf</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <p>Ukuran maksimal per file: 10MB</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <p>Nama file akan digunakan sebagai judul cerita</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <p>Semua cerita akan disimpan sebagai draft terlebih dahulu</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle>Pilih File</CardTitle>
            <CardDescription>Pilih satu atau beberapa file cerita untuk diupload</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Drag & drop file di sini</p>
                <p className="text-sm text-muted-foreground">atau</p>
                <div>
                  <input
                    type="file"
                    multiple
                    accept=".txt,.docx,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button asChild variant="outline">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      Pilih File
                    </label>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File List */}
        {files.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>File yang Dipilih ({files.length})</CardTitle>
                  <CardDescription>
                    {successCount > 0 && `${successCount} berhasil, `}
                    {errorCount > 0 && `${errorCount} gagal, `}
                    {files.length - successCount - errorCount} menunggu
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleClearAll} disabled={isUploading}>
                    Hapus Semua
                  </Button>
                  <Button onClick={handleUpload} disabled={isUploading || files.length === 0}>
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading ? "Mengupload..." : "Upload Semua"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isUploading && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progress Upload</span>
                    <span className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              <div className="space-y-3">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(file.status)}
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        {file.error && <p className="text-xs text-red-500">{file.error}</p>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(file.status)}
                      {file.status === "pending" && (
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveFile(file.id)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
