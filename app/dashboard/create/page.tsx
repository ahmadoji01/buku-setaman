"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Save,
  Eye,
  Sparkles,
  ImageIcon,
  Volume2,
  Loader2,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Upload,
  X,
  AlertTriangle,
  Wand2,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import type { StoryPage } from "@/lib/types"

interface EnhancedStoryPage extends StoryPage {
  audioFile?: File | string
  illustrationFile?: File | string
  pageNumber: number
  illustration: string
  text: string
  generatingIllustration?: boolean
  generatingAudio?: boolean
}

export default function CreateStoryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentLanguageGenerating, setCurrentLanguageGenerating] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    coverImage: "",
    coverImageFile: null as File | null,
    indonesian: [{ pageNumber: 1, text: "", illustration: "", illustrationFile: undefined, audioFile: undefined, generatingIllustration: false, generatingAudio: false }] as EnhancedStoryPage[],
    sundanese: [{ pageNumber: 1, text: "", illustration: "", illustrationFile: undefined, audioFile: undefined, generatingIllustration: false, generatingAudio: false }] as EnhancedStoryPage[],
    english: [{ pageNumber: 1, text: "", illustration: "", illustrationFile: undefined, audioFile: undefined, generatingIllustration: false, generatingAudio: false }] as EnhancedStoryPage[],
    isPublished: false,
  })

  if (!user || user.role !== "teacher") {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Akses Ditolak</h1>
          <p className="text-muted-foreground">Anda harus masuk sebagai guru untuk membuat cerita.</p>
        </div>
      </div>
    )
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
      setFormData(prev => ({
        ...prev,
        coverImage: reader.result as string,
        coverImageFile: file
      }))
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  const handlePageIllustrationUpload = (language: 'indonesian' | 'sundanese' | 'english', pageIndex: number, file: File) => {
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
      setFormData(prev => ({
        ...prev,
        [language]: prev[language].map((page, index) =>
          index === pageIndex
            ? { ...page, illustration: reader.result as string, illustrationFile: file }
            : page
        )
      }))
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  const handlePageAudioUpload = (language: 'indonesian' | 'sundanese' | 'english', pageIndex: number, file: File) => {
    if (!file.type.startsWith('audio/')) {
      setError('File harus berupa audio')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Ukuran file audio maksimal 10MB')
      return
    }

    setFormData(prev => ({
      ...prev,
      [language]: prev[language].map((page, index) =>
        index === pageIndex
          ? { ...page, audioFile: file }
          : page
      )
    }))
    setError(null)
  }

  const generateIllustration = async (language: 'indonesian' | 'sundanese' | 'english', pageIndex: number) => {
    const page = formData[language][pageIndex]
    if (!page.text.trim()) {
      setError('Masukkan teks halaman terlebih dahulu')
      return
    }

    try {
      setFormData(prev => ({
        ...prev,
        [language]: prev[language].map((p, i) =>
          i === pageIndex ? { ...p, generatingIllustration: true } : p
        )
      }))

      const response = await fetch('/api/generate-illustration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: page.text,
          language,
          pageNumber: page.pageNumber
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghasilkan ilustrasi')
      }

      // Convert base64 to File
      const base64Data = data.illustration.split(',')[1] || data.illustration
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/png' })
      const file = new File([blob], `illustration_${language}_${pageIndex}.png`, { type: 'image/png' })

      setFormData(prev => ({
        ...prev,
        [language]: prev[language].map((p, i) =>
          i === pageIndex 
            ? { ...p, illustration: data.illustration, illustrationFile: file, generatingIllustration: false }
            : p
        )
      }))
      setError(null)
    } catch (error) {
      console.error('Illustration generation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghasilkan ilustrasi'
      setError(errorMessage)
      setFormData(prev => ({
        ...prev,
        [language]: prev[language].map((p, i) =>
          i === pageIndex ? { ...p, generatingIllustration: false } : p
        )
      }))
    }
  }

  const generateAudio = async (language: 'indonesian' | 'sundanese' | 'english', pageIndex: number) => {
    const page = formData[language][pageIndex]
    if (!page.text.trim()) {
      setError('Masukkan teks halaman terlebih dahulu')
      return
    }

    try {
      setFormData(prev => ({
        ...prev,
        [language]: prev[language].map((p, i) =>
          i === pageIndex ? { ...p, generatingAudio: true } : p
        )
      }))

      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: page.text,
          language,
          pageNumber: page.pageNumber
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghasilkan audio')
      }

      // Convert base64 to File
      try {
        const base64Data = data.audio.split(',')[1] || data.audio
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        
        // Use more generic audio type for better compatibility
        const blob = new Blob([byteArray], { type: 'audio/mpeg' })
        const file = new File([blob], `audio_${language}_${pageIndex}.mp3`, { type: 'audio/mpeg' })
        
        // Verify file was created properly
        if (!file || file.size === 0) {
          throw new Error('Failed to create audio file')
        }
      } catch (conversionError) {
        console.error('Audio conversion error:', conversionError)
        throw new Error('Failed to process generated audio: ' + (conversionError instanceof Error ? conversionError.message : 'Unknown error'))
      }

      setFormData(prev => ({
        ...prev,
        [language]: prev[language].map((p, i) =>
          i === pageIndex 
            ? { ...p, audioFile: file, generatingAudio: false }
            : p
        )
      }))
      setError(null)
    } catch (error) {
      console.error('Audio generation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghasilkan audio'
      setError(errorMessage)
      setFormData(prev => ({
        ...prev,
        [language]: prev[language].map((p, i) =>
          i === pageIndex ? { ...p, generatingAudio: false } : p
        )
      }))
    }
  }

  const generateAllForLanguage = async (language: 'indonesian' | 'sundanese' | 'english') => {
    const pages = formData[language].filter(p => p.text.trim())
    if (pages.length === 0) {
      setError('Tambahkan teks untuk minimal satu halaman')
      return
    }

    setCurrentLanguageGenerating(language)
    try {
      for (let i = 0; i < formData[language].length; i++) {
        if (formData[language][i].text.trim()) {
          if (!formData[language][i].illustration) {
            await generateIllustration(language, i)
          }
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500))
          
          if (!formData[language][i].audioFile) {
            await generateAudio(language, i)
          }
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    } finally {
      setCurrentLanguageGenerating(null)
    }
  }

  const addPage = (language: 'indonesian' | 'sundanese' | 'english') => {
    setFormData((prev) => ({
      ...prev,
      [language]: [...prev[language], { pageNumber: prev[language].length + 1, text: "", illustration: "", illustrationFile: undefined, audioFile: undefined, generatingIllustration: false, generatingAudio: false }],
    }))
  }

  const removePage = (language: 'indonesian' | 'sundanese' | 'english', pageIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      [language]: prev[language]
        .filter((_, index) => index !== pageIndex)
        .map((page, index) => ({ ...page, pageNumber: index + 1 })),
    }))
  }

  const updatePageText = (language: 'indonesian' | 'sundanese' | 'english', pageIndex: number, text: string) => {
    setFormData((prev) => ({
      ...prev,
      [language]: prev[language].map((page, index) => (index === pageIndex ? { ...page, text } : page)),
    }))
  }

  const movePageUp = (language: 'indonesian' | 'sundanese' | 'english', pageIndex: number) => {
    if (pageIndex === 0) return

    setFormData((prev) => {
      const pages = [...prev[language]]
      const temp = pages[pageIndex]
      pages[pageIndex] = pages[pageIndex - 1]
      pages[pageIndex - 1] = temp
      pages[pageIndex].pageNumber = pageIndex + 1
      pages[pageIndex - 1].pageNumber = pageIndex
      return { ...prev, [language]: pages }
    })
  }

  const movePageDown = (language: 'indonesian' | 'sundanese' | 'english', pageIndex: number) => {
    const pages = formData[language]
    if (pageIndex === pages.length - 1) return

    setFormData((prev) => {
      const newPages = [...prev[language]]
      const temp = newPages[pageIndex]
      newPages[pageIndex] = newPages[pageIndex + 1]
      newPages[pageIndex + 1] = temp
      newPages[pageIndex].pageNumber = pageIndex + 1
      newPages[pageIndex + 1].pageNumber = pageIndex + 2
      return { ...prev, [language]: newPages }
    })
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async (publish = false) => {
    setError(null)

    if (!formData.title.trim()) {
      setError("Judul cerita wajib diisi")
      return
    }

    if (!formData.indonesian.some((page) => page.text.trim())) {
      setError("Minimal satu halaman cerita dalam Bahasa Indonesia wajib diisi")
      return
    }

    setIsLoading(true)

    try {
      const formDataToSend = new FormData()

      formDataToSend.append('title', formData.title)
      formDataToSend.append('authorId', user?.id || '')
      formDataToSend.append('authorName', user?.name || '')
      formDataToSend.append('isPublished', publish ? 'true' : 'false')

      if (formData.coverImageFile) {
        formDataToSend.append('coverImage', formData.coverImageFile)
      }

      const content: Record<string, any> = {}

      if (formData.indonesian.some((page) => page.text.trim())) {
        content.indonesian = formData.indonesian
          .filter((page) => page.text.trim())
          .map((page, index) => ({
            pageNumber: index + 1,
            text: page.text,
          }))
      }

      if (formData.sundanese.some((page) => page.text.trim())) {
        content.sundanese = formData.sundanese
          .filter((page) => page.text.trim())
          .map((page, index) => ({
            pageNumber: index + 1,
            text: page.text,
          }))
      }

      if (formData.english.some((page) => page.text.trim())) {
        content.english = formData.english
          .filter((page) => page.text.trim())
          .map((page, index) => ({
            pageNumber: index + 1,
            text: page.text,
          }))
      }

      formDataToSend.append('content', JSON.stringify(content))

      const langs = ['indonesian', 'sundanese', 'english'] as const

      langs.forEach(lang => {
        formData[lang].forEach((page, pageIndex) => {
          if (page.text.trim()) {
            if (page.illustrationFile && page.illustrationFile instanceof File) {
              formDataToSend.append(`illustration_${lang}_${pageIndex}`, page.illustrationFile)
            }
            if (page.audioFile && page.audioFile instanceof File) {
              console.log(`Adding audio file: audio_${lang}_${pageIndex}`, {
                name: page.audioFile.name,
                size: page.audioFile.size,
                type: page.audioFile.type
              })
              formDataToSend.append(`audio_${lang}_${pageIndex}`, page.audioFile)
            }
          }
        })
      })

      const response = await fetch('/api/stories', {
        method: 'POST',
        body: formDataToSend,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to save story')
      }

      alert(publish ? "Cerita berhasil disimpan dan dipublikasikan!" : "Cerita berhasil disimpan sebagai draft!")
      router.push("/dashboard")
    } catch (error) {
      console.error('Save error:', error)
      const errorMessage = error instanceof Error ? error.message : "Gagal menyimpan cerita. Silakan coba lagi."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const renderPageSection = (language: 'indonesian' | 'sundanese' | 'english', langLabel: string, isRequired: boolean) => {
    const pages = formData[language]
    const borderColor = language === 'indonesian' ? 'border-l-primary' : language === 'sundanese' ? 'border-l-secondary' : 'border-l-accent'

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Label>Halaman Cerita {langLabel} {isRequired ? '*' : '(Opsional)'}</Label>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => generateAllForLanguage(language)}
              disabled={currentLanguageGenerating === language || !pages.some(p => p.text.trim())}
            >
              {currentLanguageGenerating === language ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate All
                </>
              )}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => addPage(language)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Halaman
            </Button>
          </div>
        </div>

        {pages.map((page, index) => (
          <Card key={index} className={`border-l-4 ${borderColor}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Halaman {page.pageNumber}</CardTitle>
                <div className="flex items-center space-x-2">
                  {index > 0 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => movePageUp(language, index)}>
                      <MoveUp className="h-4 w-4" />
                    </Button>
                  )}
                  {index < pages.length - 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => movePageDown(language, index)}>
                      <MoveDown className="h-4 w-4" />
                    </Button>
                  )}
                  {pages.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removePage(language, index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Teks Halaman</Label>
                <Textarea
                  placeholder={`Tulis konten halaman ${page.pageNumber}...`}
                  className="min-h-[100px]"
                  value={page.text}
                  onChange={(e) => updatePageText(language, index, e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Ilustrasi Halaman (Opsional)</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => generateIllustration(language, index)}
                      disabled={!page.text.trim() || page.generatingIllustration}
                    >
                      {page.generatingIllustration ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          AI
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-3 w-3 mr-1" />
                          AI
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="mt-1">
                    {page.illustration ? (
                      <div className="relative inline-block">
                        <img
                          src={page.illustration}
                          alt={`Ilustrasi halaman ${page.pageNumber}`}
                          className="h-32 w-40 object-cover rounded border"
                        />
                        <button
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            [language]: prev[language].map((p, i) =>
                              i === index ? { ...p, illustration: '', illustrationFile: undefined } : p
                            )
                          }))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center w-40 h-32 border-2 border-dashed rounded cursor-pointer hover:bg-muted transition-colors">
                        <div className="text-center">
                          <ImageIcon className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Upload Gambar</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handlePageIllustrationUpload(language, index, e.target.files[0])}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Audio Halaman (Opsional)</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => generateAudio(language, index)}
                      disabled={!page.text.trim() || page.generatingAudio}
                    >
                      {page.generatingAudio ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          AI
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-3 w-3 mr-1" />
                          AI
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="mt-1 space-y-2">
                    {page.audioFile ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                          <span className="truncate flex-1">{typeof page.audioFile === 'string' ? page.audioFile : page.audioFile.name}</span>
                          <button
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              [language]: prev[language].map((p, i) =>
                                i === index ? { ...p, audioFile: undefined } : p
                              )
                            }))}
                            className="text-red-500 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center border-2 border-dashed rounded p-3 cursor-pointer hover:bg-muted transition-colors">
                        <div className="text-center">
                          <Volume2 className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Upload Audio</span>
                        </div>
                        <input
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handlePageAudioUpload(language, index, e.target.files[0])}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-2">Buat Cerita Baru</h1>
        <p className="text-lg text-muted-foreground">Buat cerita dengan teks, ilustrasi, dan audio untuk setiap halaman</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
            <CardDescription>Masukkan judul dan sampul cerita</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Judul Cerita *</Label>
              <Input
                id="title"
                placeholder="Masukkan judul cerita..."
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="coverImage">Sampul Buku (Opsional)</Label>
              <div className="mt-1 flex items-center gap-4">
                {formData.coverImage ? (
                  <div className="relative inline-block">
                    <img
                      src={formData.coverImage}
                      alt="Cover preview"
                      className="h-32 w-24 object-cover rounded border"
                    />
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, coverImage: '', coverImageFile: null }))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-24 h-32 border-2 border-dashed rounded cursor-pointer hover:bg-muted transition-colors">
                    <div className="text-center">
                      <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload</span>
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
                <div className="text-sm text-muted-foreground">
                  <p>Format: JPG, PNG</p>
                  <p>Maksimal 5MB</p>
                  <p>Rasio 2:3 disarankan</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Konten Cerita</CardTitle>
            <CardDescription>
              Tambahkan teks, ilustrasi, dan narasi audio untuk setiap halaman. Gunakan tombol AI untuk auto-generate konten media
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="indonesian" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="indonesian">Bahasa Indonesia *</TabsTrigger>
                <TabsTrigger value="sundanese">Basa Sunda</TabsTrigger>
                <TabsTrigger value="english">English</TabsTrigger>
              </TabsList>

              <TabsContent value="indonesian">
                {renderPageSection('indonesian', 'dalam Bahasa Indonesia', true)}
              </TabsContent>

              <TabsContent value="sundanese">
                {renderPageSection('sundanese', 'dalam Basa Sunda', false)}
              </TabsContent>

              <TabsContent value="english">
                {renderPageSection('english', 'in English', false)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={() => handleSave(false)} 
            disabled={isLoading} 
            variant="outline" 
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan sebagai Draft
              </>
            )}
          </Button>
          <Button 
            onClick={() => handleSave(true)} 
            disabled={isLoading} 
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Simpan & Publikasikan
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}