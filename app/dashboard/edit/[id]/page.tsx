"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import type { Story } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Save,
  Eye,
  ImageIcon,
  Volume2,
  Loader2,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Upload,
  X,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"

interface EnhancedStoryPage {
  pageNumber: number
  text: string
  illustration: string
  illustrationFile?: File | string
  audioFiles?: {
    indonesian?: File | string
    sundanese?: File | string
    english?: File | string
  }
}

export default function EditStoryPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [story, setStory] = useState<Story | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    coverImage: "",
    coverImageFile: null as File | null,
    isPublished: false,
  })

  const [pages, setPages] = useState<EnhancedStoryPage[]>([])
  const [storyText, setStoryText] = useState({
    indonesian: [] as string[],
    sundanese: [] as string[],
    english: [] as string[],
  })

  useEffect(() => {
    const fetchStory = async () => {
      if (!user?.id) return

      try {
        const response = await fetch(`/api/stories/${params.id}`)
        const data = await response.json()

        if (!response.ok) {
          setError("Gagal memuat cerita")
          return
        }

        const fetchedStory = data.story
        setStory(fetchedStory)

        // Initialize form with story data
        setFormData({
          title: fetchedStory.title,
          coverImage: fetchedStory.coverImage || "",
          coverImageFile: null,
          isPublished: fetchedStory.isPublished,
        })

        // Initialize pages and text
        if (fetchedStory.content && fetchedStory.content.indonesian) {
          const indonesianPages = fetchedStory.content.indonesian
          const pageCount = indonesianPages.length

          const newPages: EnhancedStoryPage[] = indonesianPages.map(
            (page: any, index: number) => ({
              pageNumber: index + 1,
              text: "",
              illustration: page.illustration || "",
              illustrationFile: undefined,
              audioFiles: {
                indonesian: undefined,
                sundanese: undefined,
                english: undefined,
              },
            })
          )

          setPages(newPages)

          const newStoryText = {
            indonesian: fetchedStory.content.indonesian?.map((p: any) => p.text) || [],
            sundanese: fetchedStory.content.sundanese?.map((p: any) => p.text) || [],
            english: fetchedStory.content.english?.map((p: any) => p.text) || [],
          }

          setStoryText(newStoryText)
        }
      } catch (error) {
        console.error("Error fetching story:", error)
        setError("Terjadi kesalahan saat memuat cerita")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStory()
  }, [user?.id, params.id])

  if (!user || user.role !== "teacher") {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Akses Ditolak</h1>
          <p className="text-muted-foreground">Anda harus masuk sebagai guru untuk mengedit cerita.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Memuat cerita...</p>
        </div>
      </div>
    )
  }

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5MB")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        coverImage: reader.result as string,
        coverImageFile: file,
      }))
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  const handlePageIllustrationUpload = (pageIndex: number, file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5MB")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPages((prev) =>
        prev.map((page, index) =>
          index === pageIndex
            ? { ...page, illustration: reader.result as string, illustrationFile: file }
            : page
        )
      )
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  const handlePageAudioUpload = (
    pageIndex: number,
    language: "indonesian" | "sundanese" | "english",
    file: File
  ) => {
    if (!file.type.startsWith("audio/")) {
      setError("File harus berupa audio")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Ukuran file audio maksimal 10MB")
      return
    }

    setPages((prev) =>
      prev.map((page, index) =>
        index === pageIndex
          ? {
              ...page,
              audioFiles: {
                ...page.audioFiles,
                [language]: file,
              },
            }
          : page
      )
    )
    setError(null)
  }

  const updatePageText = (
    language: "indonesian" | "sundanese" | "english",
    pageIndex: number,
    text: string
  ) => {
    setStoryText((prev) => ({
      ...prev,
      [language]: prev[language].map((t, index) => (index === pageIndex ? text : t)),
    }))
  }

  const handleSave = async (publish = false) => {
    setError(null)

    if (!formData.title.trim()) {
      setError("Judul cerita wajib diisi")
      return
    }

    if (!storyText.indonesian.some((text) => text.trim())) {
      setError("Minimal satu halaman cerita dalam Bahasa Indonesia wajib diisi")
      return
    }

    setIsSaving(true)

    try {
      // ✅ FIXED: Build content in proper JSON structure with ALL languages
      const content: Record<string, any> = {}
      const languages = ["indonesian", "sundanese", "english"] as const

      for (const lang of languages) {
        const langText = storyText[lang]
        // Include language even if it has empty strings, to preserve structure
        if (langText && langText.length > 0) {
          content[lang] = langText
            .map((text, index) => ({
              pageNumber: index + 1,
              text: text || "", // Keep even if empty
            }))
        }
      }

      // ✅ Make sure Indonesian has content (required)
      if (!content.indonesian || content.indonesian.length === 0) {
        setError("Minimal ada satu halaman dengan teks dalam Bahasa Indonesia")
        setIsSaving(false)
        return
      }

      console.log("📝 Content being sent:", content)

      // ✅ FIXED: Send as JSON with proper structure
      const response = await fetch(`/api/stories/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: content,
          isPublished: publish,
          illustrations: pages
            .map((p) => p.illustration)
            .filter((ill) => ill && typeof ill === "string"),
          audioFiles: {},
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || "Gagal menyimpan cerita")
      }

      alert(publish ? "Cerita berhasil diperbarui dan dipublikasikan!" : "Cerita berhasil diperbarui sebagai draft!")
      router.push("/dashboard")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan"
      setError(errorMessage)
      console.error("Save error:", error)
      setIsSaving(false)
    }
  }

  const addPage = () => {
    const newPageNumber = pages.length + 1
    setPages([
      ...pages,
      {
        pageNumber: newPageNumber,
        text: "",
        illustration: "",
        illustrationFile: undefined,
        audioFiles: {
          indonesian: undefined,
          sundanese: undefined,
          english: undefined,
        },
      },
    ])
    setStoryText((prev) => ({
      ...prev,
      indonesian: [...prev.indonesian, ""],
      sundanese: [...prev.sundanese, ""],
      english: [...prev.english, ""],
    }))
  }

  const removePage = (pageIndex: number) => {
    if (pages.length === 1) {
      setError("Minimal harus ada satu halaman")
      return
    }
    setPages((prev) => prev.filter((_, index) => index !== pageIndex))
    setStoryText((prev) => ({
      ...prev,
      indonesian: prev.indonesian.filter((_, index) => index !== pageIndex),
      sundanese: prev.sundanese.filter((_, index) => index !== pageIndex),
      english: prev.english.filter((_, index) => index !== pageIndex),
    }))
  }

  const movePageUp = (pageIndex: number) => {
    if (pageIndex === 0) return

    setPages((prev) => {
      const newPages = [...prev]
      const temp = newPages[pageIndex]
      newPages[pageIndex] = newPages[pageIndex - 1]
      newPages[pageIndex - 1] = temp
      return newPages
    })

    setStoryText((prev) => ({
      ...prev,
      indonesian: moveArrayItem(prev.indonesian, pageIndex, pageIndex - 1),
      sundanese: moveArrayItem(prev.sundanese, pageIndex, pageIndex - 1),
      english: moveArrayItem(prev.english, pageIndex, pageIndex - 1),
    }))
  }

  const movePageDown = (pageIndex: number) => {
    if (pageIndex === pages.length - 1) return

    setPages((prev) => {
      const newPages = [...prev]
      const temp = newPages[pageIndex]
      newPages[pageIndex] = newPages[pageIndex + 1]
      newPages[pageIndex + 1] = temp
      return newPages
    })

    setStoryText((prev) => ({
      ...prev,
      indonesian: moveArrayItem(prev.indonesian, pageIndex, pageIndex + 1),
      sundanese: moveArrayItem(prev.sundanese, pageIndex, pageIndex + 1),
      english: moveArrayItem(prev.english, pageIndex, pageIndex + 1),
    }))
  }

  const moveArrayItem = (arr: string[], fromIndex: number, toIndex: number) => {
    const newArr = [...arr]
    const temp = newArr[fromIndex]
    newArr[fromIndex] = newArr[toIndex]
    newArr[toIndex] = temp
    return newArr
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Edit Cerita</h1>
        <p className="text-lg text-muted-foreground">Ubah konten, ilustrasi, dan audio cerita Anda</p>
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
            <CardDescription>Ubah judul dan sampul cerita</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Judul Cerita *</Label>
              <Input
                id="title"
                placeholder="Masukkan judul cerita..."
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
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
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, coverImage: "", coverImageFile: null }))
                      }
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
            <CardDescription>Edit teks, ilustrasi, dan audio untuk setiap halaman</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Halaman Cerita ({pages.length})</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPage}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Halaman
                </Button>
              </div>

              {pages.map((page, pageIndex) => (
                <Card key={pageIndex} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Halaman {page.pageNumber}</CardTitle>
                      <div className="flex items-center space-x-2">
                        {pageIndex > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => movePageUp(pageIndex)}
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                        )}
                        {pageIndex < pages.length - 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => movePageDown(pageIndex)}
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                        )}
                        {pages.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePage(pageIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Shared Illustration */}
                    <div>
                      <Label className="mb-2 block">Ilustrasi Halaman</Label>
                      <div className="mt-1">
                        {page.illustration ? (
                          <div className="relative inline-block">
                            <img
                              src={page.illustration}
                              alt={`Ilustrasi halaman ${page.pageNumber}`}
                              className="h-32 w-40 object-cover rounded border"
                            />
                            <button
                              onClick={() =>
                                setPages((prev) =>
                                  prev.map((p, i) =>
                                    i === pageIndex
                                      ? { ...p, illustration: "", illustrationFile: undefined }
                                      : p
                                  )
                                )
                              }
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
                              onChange={(e) =>
                                e.target.files?.[0] &&
                                handlePageIllustrationUpload(pageIndex, e.target.files[0])
                              }
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Language-specific text and audio */}
                    <Tabs defaultValue="indonesian" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="indonesian">🇮🇩 Indonesia</TabsTrigger>
                        <TabsTrigger value="sundanese">🗣️ Sunda</TabsTrigger>
                        <TabsTrigger value="english">🇬🇧 English</TabsTrigger>
                      </TabsList>

                      {(["indonesian", "sundanese", "english"] as const).map((lang) => (
                        <TabsContent key={lang} value={lang} className="space-y-4 mt-4">
                          <div>
                            <Label htmlFor={`text-${lang}-${pageIndex}`}>
                              Teks Halaman {lang === "indonesian" ? "*" : "(Opsional)"}
                            </Label>
                            <Textarea
                              id={`text-${lang}-${pageIndex}`}
                              placeholder={`Tulis teks halaman ${page.pageNumber} dalam ${lang}...`}
                              className="min-h-[100px]"
                              value={storyText[lang][pageIndex] || ""}
                              onChange={(e) => updatePageText(lang, pageIndex, e.target.value)}
                            />
                          </div>

                          <div>
                            <Label className="mb-2 block">Audio Halaman (Opsional)</Label>
                            <div className="mt-1 space-y-2">
                              {page.audioFiles?.[lang] ? (
                                <div className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                                  <span className="truncate flex-1">
                                    {typeof page.audioFiles[lang] === "string"
                                      ? page.audioFiles[lang]
                                      : (page.audioFiles[lang] as File).name}
                                  </span>
                                  <button
                                    onClick={() =>
                                      setPages((prev) =>
                                        prev.map((p, i) =>
                                          i === pageIndex
                                            ? {
                                                ...p,
                                                audioFiles: { ...p.audioFiles, [lang]: undefined },
                                              }
                                            : p
                                        )
                                      )
                                    }
                                    className="text-red-500 hover:text-red-600"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
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
                                    onChange={(e) =>
                                      e.target.files?.[0] &&
                                      handlePageAudioUpload(pageIndex, lang, e.target.files[0])
                                    }
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => handleSave(false)}
            disabled={isSaving || !formData.title.trim()}
            variant="outline"
            className="flex-1"
          >
            {isSaving ? (
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
            disabled={isSaving || !formData.title.trim()}
            className="flex-1"
          >
            {isSaving ? (
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