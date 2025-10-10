"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
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
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { useAIGeneration } from "@/hooks/use-ai-generation"
import type { StoryPage } from "@/lib/types"

export default function CreateStoryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { generateContent, generateSpeech, isGenerating, error: aiError } = useAIGeneration()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    indonesian: [{ pageNumber: 1, text: "", illustration: "" }] as StoryPage[],
    sundanese: [{ pageNumber: 1, text: "", illustration: "" }] as StoryPage[],
    english: [{ pageNumber: 1, text: "", illustration: "" }] as StoryPage[],
    isPublished: false,
  })

  const [aiContent, setAiContent] = useState({
    illustrations: [] as string[],
    audioFiles: {} as Record<string, string>,
    generationStatus: "idle" as "idle" | "generating" | "success" | "error",
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

  const addPage = (language: keyof typeof formData) => {
    if (language === "title" || language === "isPublished") return

    setFormData((prev) => ({
      ...prev,
      [language]: [...prev[language], { pageNumber: prev[language].length + 1, text: "", illustration: "" }],
    }))
  }

  const removePage = (language: keyof typeof formData, pageIndex: number) => {
    if (language === "title" || language === "isPublished") return

    setFormData((prev) => ({
      ...prev,
      [language]: prev[language]
        .filter((_, index) => index !== pageIndex)
        .map((page, index) => ({ ...page, pageNumber: index + 1 })),
    }))
  }

  const updatePageText = (language: keyof typeof formData, pageIndex: number, text: string) => {
    if (language === "title" || language === "isPublished") return

    setFormData((prev) => ({
      ...prev,
      [language]: prev[language].map((page, index) => (index === pageIndex ? { ...page, text } : page)),
    }))
  }

  const movePageUp = (language: keyof typeof formData, pageIndex: number) => {
    if (language === "title" || language === "isPublished" || pageIndex === 0) return

    setFormData((prev) => {
      const pages = [...prev[language]]
      const temp = pages[pageIndex]
      pages[pageIndex] = pages[pageIndex - 1]
      pages[pageIndex - 1] = temp

      // Update page numbers
      pages[pageIndex].pageNumber = pageIndex + 1
      pages[pageIndex - 1].pageNumber = pageIndex

      return { ...prev, [language]: pages }
    })
  }

  const movePageDown = (language: keyof typeof formData, pageIndex: number) => {
    if (language === "title" || language === "isPublished") return

    const pages = formData[language]
    if (pageIndex === pages.length - 1) return

    setFormData((prev) => {
      const newPages = [...prev[language]]
      const temp = newPages[pageIndex]
      newPages[pageIndex] = newPages[pageIndex + 1]
      newPages[pageIndex + 1] = temp

      // Update page numbers
      newPages[pageIndex].pageNumber = pageIndex + 1
      newPages[pageIndex + 1].pageNumber = pageIndex + 2

      return { ...prev, [language]: newPages }
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleGenerateAI = async () => {
    const allIndonesianText = formData.indonesian.map((page) => page.text).join(" ")

    if (!allIndonesianText.trim()) {
      alert("Silakan masukkan cerita dalam Bahasa Indonesia terlebih dahulu")
      return
    }

    setAiContent((prev) => ({ ...prev, generationStatus: "generating" }))

    try {
      // Generate illustrations and audio for Indonesian text
      const result = await generateContent(allIndonesianText)

      if (result.error) {
        throw new Error(result.error)
      }

      const audioFiles: Record<string, string> = {}

      // Generate audio for Indonesian
      if (allIndonesianText) {
        const indonesianAudio = await generateSpeech(allIndonesianText, "id")
        if (indonesianAudio) audioFiles.indonesian = indonesianAudio
      }

      // Generate audio for Sundanese if available
      const allSundaneseText = formData.sundanese.map((page) => page.text).join(" ")
      if (allSundaneseText.trim()) {
        const sundaneseAudio = await generateSpeech(allSundaneseText, "su")
        if (sundaneseAudio) audioFiles.sundanese = sundaneseAudio
      }

      // Generate audio for English if available
      const allEnglishText = formData.english.map((page) => page.text).join(" ")
      if (allEnglishText.trim()) {
        const englishAudio = await generateSpeech(allEnglishText, "en")
        if (englishAudio) audioFiles.english = englishAudio
      }

      setAiContent({
        illustrations: result.illustrations,
        audioFiles,
        generationStatus: "success",
      })
    } catch (error) {
      console.error("AI generation failed:", error)
      setAiContent((prev) => ({
        ...prev,
        generationStatus: "error",
      }))
    }
  }

  const handleSave = async (publish = false) => {
    if (!formData.title.trim() || !formData.indonesian.some((page) => page.text.trim())) {
      alert("Judul dan minimal satu halaman cerita dalam Bahasa Indonesia wajib diisi")
      return
    }

    setIsLoading(true)

    try {
      // Prepare the story data
      const storyData = {
        title: formData.title,
        content: {
          indonesian: formData.indonesian.filter((page) => page.text.trim()),
          ...(formData.sundanese.some((page) => page.text.trim()) && {
            sundanese: formData.sundanese.filter((page) => page.text.trim()),
          }),
          ...(formData.english.some((page) => page.text.trim()) && {
            english: formData.english.filter((page) => page.text.trim()),
          }),
        },
        authorId: user?.id || '',
        authorName: user?.name || '',
        isPublished: publish,
        illustrations: aiContent.illustrations.length > 0 ? aiContent.illustrations : ["/placeholder.svg"],
        audioFiles: aiContent.audioFiles,
      }

      // Call the API to save the story
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storyData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save story')
      }

      alert(publish ? "Cerita berhasil disimpan dan dipublikasikan!" : "Cerita berhasil disimpan sebagai draft!")
      router.push("/dashboard")
    } catch (error) {
      console.error('Save error:', error)
      alert("Gagal menyimpan cerita. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

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
        <h1 className="text-3xl font-bold text-foreground mb-2">Buat Cerita Baru</h1>
        <p className="text-lg text-muted-foreground">Buat cerita menarik untuk anak-anak dengan multiple halaman</p>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
            <CardDescription>Masukkan judul dan informasi dasar cerita</CardDescription>
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
          </CardContent>
        </Card>

        {/* Story Content */}
        <Card>
          <CardHeader>
            <CardTitle>Konten Cerita</CardTitle>
            <CardDescription>
              Masukkan cerita dalam berbagai bahasa dengan multiple halaman. Bahasa Indonesia wajib diisi, bahasa lain
              opsional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="indonesian" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="indonesian">Bahasa Indonesia *</TabsTrigger>
                <TabsTrigger value="sundanese">Basa Sunda</TabsTrigger>
                <TabsTrigger value="english">English</TabsTrigger>
              </TabsList>

              <TabsContent value="indonesian" className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Halaman Cerita dalam Bahasa Indonesia</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => addPage("indonesian")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Halaman
                  </Button>
                </div>

                {formData.indonesian.map((page, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Halaman {page.pageNumber}</CardTitle>
                        <div className="flex items-center space-x-2">
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => movePageUp("indonesian", index)}
                            >
                              <MoveUp className="h-4 w-4" />
                            </Button>
                          )}
                          {index < formData.indonesian.length - 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => movePageDown("indonesian", index)}
                            >
                              <MoveDown className="h-4 w-4" />
                            </Button>
                          )}
                          {formData.indonesian.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePage("indonesian", index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder={`Tulis konten halaman ${page.pageNumber}...`}
                        className="min-h-[120px]"
                        value={page.text}
                        onChange={(e) => updatePageText("indonesian", index, e.target.value)}
                      />
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="sundanese" className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Halaman Cerita dalam Basa Sunda (Opsional)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => addPage("sundanese")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Halaman
                  </Button>
                </div>

                {formData.sundanese.map((page, index) => (
                  <Card key={index} className="border-l-4 border-l-secondary">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Halaman {page.pageNumber}</CardTitle>
                        <div className="flex items-center space-x-2">
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => movePageUp("sundanese", index)}
                            >
                              <MoveUp className="h-4 w-4" />
                            </Button>
                          )}
                          {index < formData.sundanese.length - 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => movePageDown("sundanese", index)}
                            >
                              <MoveDown className="h-4 w-4" />
                            </Button>
                          )}
                          {formData.sundanese.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePage("sundanese", index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder={`Tulis konten halaman ${page.pageNumber}...`}
                        className="min-h-[120px]"
                        value={page.text}
                        onChange={(e) => updatePageText("sundanese", index, e.target.value)}
                      />
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="english" className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Story Pages in English (Optional)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => addPage("english")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Page
                  </Button>
                </div>

                {formData.english.map((page, index) => (
                  <Card key={index} className="border-l-4 border-l-accent">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Page {page.pageNumber}</CardTitle>
                        <div className="flex items-center space-x-2">
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => movePageUp("english", index)}
                            >
                              <MoveUp className="h-4 w-4" />
                            </Button>
                          )}
                          {index < formData.english.length - 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => movePageDown("english", index)}
                            >
                              <MoveDown className="h-4 w-4" />
                            </Button>
                          )}
                          {formData.english.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePage("english", index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder={`Write content for page ${page.pageNumber}...`}
                        className="min-h-[120px]"
                        value={page.text}
                        onChange={(e) => updatePageText("english", index, e.target.value)}
                      />
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* AI Generation */}
        <Card>
          <CardHeader>
            <CardTitle>Generasi AI</CardTitle>
            <CardDescription>
              Gunakan AI untuk menghasilkan ilustrasi dan narasi audio berdasarkan cerita Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                onClick={handleGenerateAI}
                disabled={isGenerating || !formData.indonesian.some((page) => page.text.trim())}
                className="flex items-center space-x-2"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>{isGenerating ? "Menghasilkan..." : "Generate Ilustrasi & Audio"}</span>
              </Button>

              {aiContent.generationStatus === "success" && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Berhasil
                </Badge>
              )}

              {aiContent.generationStatus === "error" && (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Gagal
                </Badge>
              )}
            </div>

            {aiError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{aiError}</AlertDescription>
              </Alert>
            )}

            {!process.env.OPENAI_API_KEY && (
              <Alert>
                <AlertDescription>
                  OpenAI API key belum dikonfigurasi. Silakan tambahkan OPENAI_API_KEY ke environment variables.
                </AlertDescription>
              </Alert>
            )}

            {/* Generated Content Preview */}
            {aiContent.illustrations.length > 0 && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Ilustrasi yang Dihasilkan ({aiContent.illustrations.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {aiContent.illustrations.map((url, index) => (
                      <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden">
                        <img
                          src={url || "/placeholder.svg"}
                          alt={`Ilustrasi ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {Object.keys(aiContent.audioFiles).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Volume2 className="h-4 w-4 mr-2" />
                      Audio yang Dihasilkan
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(aiContent.audioFiles).map(([language, url]) => (
                        <div key={language} className="flex items-center space-x-3">
                          <Badge variant="outline">
                            {language === "indonesian" && "Bahasa Indonesia"}
                            {language === "sundanese" && "Basa Sunda"}
                            {language === "english" && "English"}
                          </Badge>
                          <audio controls className="flex-1">
                            <source src={url} type="audio/mpeg" />
                            Browser Anda tidak mendukung audio.
                          </audio>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              AI akan menghasilkan ilustrasi dan narasi audio berdasarkan semua halaman cerita dalam Bahasa Indonesia
            </p>
          </CardContent>
        </Card>

        {/* Publishing Options */}
        <Card>
          <CardHeader>
            <CardTitle>Opsi Publikasi</CardTitle>
            <CardDescription>
              Pilih apakah cerita akan langsung dipublikasikan atau disimpan sebagai draft
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="publish"
                checked={formData.isPublished}
                onCheckedChange={(checked) => handleInputChange("isPublished", checked.toString())}
              />
              <Label htmlFor="publish">Publikasikan cerita setelah disimpan</Label>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={() => handleSave(false)} disabled={isLoading} variant="outline" className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Menyimpan..." : "Simpan sebagai Draft"}
          </Button>
          <Button onClick={() => handleSave(true)} disabled={isLoading} className="flex-1">
            <Eye className="mr-2 h-4 w-4" />
            {isLoading ? "Menyimpan..." : "Simpan & Publikasikan"}
          </Button>
        </div>
      </div>
    </div>
  )
}
