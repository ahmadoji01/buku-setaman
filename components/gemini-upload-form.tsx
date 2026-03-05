"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  Cloud,
  AlertCircle,
  CheckCircle,
  Upload,
  Info,
  ExternalLink,
  ImageIcon,
  X
} from "lucide-react"

interface GeminiUploadProps {
  onTitleChange: (title: string) => void
  onCoverImageChange: (file: File | null, preview: string) => void
  onGeminiUrlChange: (url: string) => void
  title: string
  coverImage: string
  geminiUrl: string
}

export function GeminiUploadForm({
  onTitleChange,
  onCoverImageChange,
  onGeminiUrlChange,
  title,
  coverImage,
  geminiUrl
}: GeminiUploadProps) {
  const [error, setError] = useState<string | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)

  const validateGeminiUrl = (url: string) => {
    if (!url.trim()) {
      setUrlError(null)
      return true
    }

    if (!url.includes('gemini.google.com/share')) {
      setUrlError('URL harus dari gemini.google.com/share/...')
      return false
    }

    const match = url.match(/gemini\.google\.com\/share\/([a-zA-Z0-9]+)/)
    if (!match || !match[1]) {
      setUrlError('Format link tidak valid')
      return false
    }

    setUrlError(null)
    return true
  }

  const handleUrlChange = (value: string) => {
    onGeminiUrlChange(value)
    validateGeminiUrl(value)
  }

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      onCoverImageChange(file, reader.result as string)
      setError(null)
    }
    reader.onerror = () => {
      setError('Gagal membaca file')
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveCover = () => {
    onCoverImageChange(null, "")
    const input = document.getElementById('cover-upload') as HTMLInputElement
    if (input) input.value = ""
  }

  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Cloud className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              📚 Import dari Gemini Storybook
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Isi judul, sampul cerita, dan link Gemini Storybook. Cerita akan ditampilkan langsung dari Gemini tanpa perlu copy konten.
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Title Input */}
      <div>
        <Label htmlFor="gemini-title" className="text-base font-medium">
          Judul Cerita *
        </Label>
        <Input
          id="gemini-title"
          placeholder="Masukkan judul cerita..."
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="mt-2"
        />
      </div>

      {/* Cover Image Upload */}
      <div>
        <Label className="text-base font-medium mb-2 block">
          Sampul Buku *
        </Label>
        <p className="text-sm text-muted-foreground mb-3">
          💡 Tip: Screenshot sampul buku dari Gemini Storybook, lalu upload di sini
        </p>
        
        {coverImage ? (
          <div className="relative inline-block">
            <img
              src={coverImage}
              alt="Cover preview"
              className="h-40 w-32 object-cover rounded border-2 border-primary"
            />
            <button
              onClick={handleRemoveCover}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">Klik untuk upload</span> atau drag & drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, WebP (Max 5MB)
              </p>
            </div>
            <input
              id="cover-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverImageUpload}
            />
          </label>
        )}
      </div>

      {/* Gemini URL Input */}
      <div>
        <Label htmlFor="gemini-url" className="text-base font-medium">
          Link Gemini Storybook *
        </Label>
        <p className="text-sm text-muted-foreground mb-2">
          Paste link Gemini Storybook yang sudah di-share
        </p>
        <Input
          id="gemini-url"
          placeholder="https://gemini.google.com/share/..."
          value={geminiUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          className={`mt-2 ${urlError ? 'border-red-500' : ''}`}
        />
        {urlError && (
          <p className="text-xs text-red-500 mt-1">{urlError}</p>
        )}
        {geminiUrl && !urlError && (
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Link valid ✓
          </p>
        )}
      </div>

      {/* Instructions */}
      <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Cara Mendapatkan Link Gemini Storybook
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-amber-900 dark:text-amber-100">
          <ol className="list-decimal list-inside space-y-1">
            <li>Buka <strong>Gemini</strong> di browser (gemini.google.com)</li>
            <li>Buat atau pilih <strong>Storybook</strong> yang ingin di-share</li>
            <li>Klik tombol <strong>Share</strong> (ikon berbagi)</li>
            <li>Pilih <strong>Share with link</strong></li>
            <li>Pastikan visibility adalah <strong>"Anyone with the link"</strong> atau <strong>"Public"</strong></li>
            <li>Copy link yang muncul</li>
            <li>Paste di form di atas</li>
          </ol>
          <div className="mt-3 p-2 bg-amber-100 dark:bg-amber-900 rounded border border-amber-300 dark:border-amber-700">
            <p className="text-xs">
              ⚠️ <strong>Penting:</strong> Storybook harus bersifat "Public" atau "Anyone with the link" agar bisa diakses dan ditampilkan di aplikasi.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Screenshot Tips */}
      <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">📸 Cara Screenshot Sampul dari Gemini</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-green-900 dark:text-green-100">
          <p>Untuk mendapatkan gambar sampul buku dari Gemini Storybook:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Buka Gemini Storybook di browser</li>
            <li>Lihat tampilan cover/halaman pertama cerita</li>
            <li>Klik kanan → "Save image as..." atau gunakan screenshot tool</li>
            <li>Simpan gambar sampul cerita</li>
            <li>Upload di form "Sampul Buku" di atas</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}