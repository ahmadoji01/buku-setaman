"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Bookmark,
  BookmarkCheck,
  Settings,
  Volume2,
  VolumeX,
  RotateCcw,
} from "lucide-react"
import type { Story, Language, BookProgress, StoryPage } from "@/lib/types"
import { cn } from "@/lib/utils"

interface BookReaderProps {
  story: Story
  onProgressUpdate?: (progress: BookProgress) => void
}

export function BookReader({ story, onProgressUpdate }: BookReaderProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("indonesian")
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const [fontFamily, setFontFamily] = useState("sans")
  const [bookmarks, setBookmarks] = useState<number[]>([])
  const [isPageTurning, setIsPageTurning] = useState(false)
  const [highlightedWord, setHighlightedWord] = useState<number>(-1)
  const [audioProgress, setAudioProgress] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)

  const audioRef = useRef<HTMLAudioElement>(null)

  const getStoryPages = (): StoryPage[] => {
    const content = story.content[selectedLanguage]

    // Handle new StoryPage array structure with per-page audio
    if (Array.isArray(content)) {
      return content
    }

    // Fallback for old string format - convert to StoryPage array
    if (typeof content === "string") {
      const sentences = content.split(". ").filter(Boolean)
      const pages: StoryPage[] = []

      for (let i = 0; i < sentences.length; i += 2) {
        const pageContent = sentences.slice(i, i + 2).join(". ") + (i + 2 < sentences.length ? "." : "")
        const pageIndex = Math.floor(i / 2)
        pages.push({
          pageNumber: pageIndex + 1,
          text: pageContent,
          illustration: story.illustrations?.[pageIndex] || story.illustrations?.[0],
          // ✅ PERBAIKAN: Tambahkan audio dari audioFiles jika tersedia
          audio: story.audioFiles?.[selectedLanguage] || null,
        })
      }

      return pages.length > 0
        ? pages
        : [
            {
              pageNumber: 1,
              text: content,
              illustration: story.illustrations?.[0],
              audio: story.audioFiles?.[selectedLanguage] || null,
            },
          ]
    }

    // Fallback to Indonesian if selected language not available
    const fallbackContent = story.content.indonesian
    if (Array.isArray(fallbackContent)) {
      return fallbackContent
    }

    return [
      {
        pageNumber: 1,
        text: typeof fallbackContent === "string" ? fallbackContent : "",
        illustration: story.illustrations?.[0],
        audio: story.audioFiles?.["indonesian"] || null,
      },
    ]
  }

  const storyPages = getStoryPages()
  
  // Create pages array with cover as first page
  const pages = story.coverImage 
    ? [
        {
          pageNumber: 0,
          text: "",
          illustration: story.coverImage,
          audio: null,
          isCover: true
        },
        ...storyPages
      ]
    : storyPages
  
  const totalPages = pages.length
  const currentPageData = pages[currentPage]
  const currentPageText = currentPageData?.text || ""
  const currentPageIllustration = currentPageData?.illustration
  const currentPageAudio = currentPageData?.audio
  const isCoverPage = currentPageData?.isCover === true
  
  useEffect(() => {
    if (currentPageData?.audio) {
      console.log('[BookReader Audio]', {
        page: currentPage,
        language: selectedLanguage,
        audioUrl: currentPageData.audio,
        audioFromPageData: !!currentPageData.audio,
      })
    }
  }, [currentPageData, currentPage, selectedLanguage])

  // Handle page navigation
  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setIsPageTurning(true)
      setTimeout(() => {
        setCurrentPage(currentPage + 1)
        setIsPageTurning(false)
      }, 300)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setIsPageTurning(true)
      setTimeout(() => {
        setCurrentPage(currentPage - 1)
        setIsPageTurning(false)
      }, 300)
    }
  }

  // Stop audio when page changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      setAudioProgress(0)
      setAudioDuration(0)
    }
  }, [currentPage, selectedLanguage])

  // Handle audio playback
  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play().catch((error) => {
          // Audio playback failed - this is normal for some browsers when user hasn't interacted with page yet
        })
        setIsPlaying(true)
      }
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleResetAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      setAudioProgress(0)
    }
  }

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setAudioProgress(audioRef.current.currentTime)
    }
  }

  const handleAudioLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration)
    }
  }

  const handleAudioEnd = () => {
    setIsPlaying(false)
    // Auto-advance to next page when audio ends
    if (currentPage < totalPages - 1) {
      goToNextPage()
    }
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
      setAudioProgress(newTime)
    }
  }

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Handle bookmarks
  const toggleBookmark = () => {
    if (bookmarks.includes(currentPage)) {
      setBookmarks(bookmarks.filter((page) => page !== currentPage))
    } else {
      setBookmarks([...bookmarks, currentPage])
    }
  }

  // Simulate read-along highlighting
  useEffect(() => {
    if (isPlaying && pages[currentPage]) {
      const words = pages[currentPage].text.split(" ") || []
      let wordIndex = 0

      const interval = setInterval(() => {
        if (wordIndex < words.length) {
          setHighlightedWord(wordIndex)
          wordIndex++
        } else {
          setHighlightedWord(-1)
          clearInterval(interval)
        }
      }, 500)

      return () => clearInterval(interval)
    } else {
      setHighlightedWord(-1)
    }
  }, [isPlaying, currentPage, pages])

  // Update progress
  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate({
        userId: "current-user",
        storyId: story.id,
        currentPage,
        totalPages,
        isCompleted: currentPage === totalPages - 1,
        bookmarks,
        lastReadAt: new Date(),
      })
    }
  }, [currentPage, totalPages, bookmarks, story.id, onProgressUpdate])

  // Language options
  const availableLanguages = Object.keys(story.content) as Language[]
  const languageLabels = {
    indonesian: "Bahasa Indonesia",
    sundanese: "Basa Sunda",
    english: "English",
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* ✅ PERBAIKAN: Audio element dengan better error handling dan logging */}
      {currentPageAudio && (
        <audio
          key={`audio-${currentPageAudio}`}
          ref={audioRef}
          onTimeUpdate={handleAudioTimeUpdate}
          onLoadedMetadata={handleAudioLoadedMetadata}
          onEnded={handleAudioEnd}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={(e) => {
            console.error('[BookReader Audio Error]', {
              src: currentPageAudio,
              errorCode: e.currentTarget.error?.code,
              errorMessage: e.currentTarget.error?.message,
            })
          }}
          crossOrigin="anonymous"
        >
          <source src={currentPageAudio} type="audio/mpeg" />
          <source src={currentPageAudio} type="audio/wav" />
        </audio>
      )}

      {/* Controls Bar */}
      <div className="flex items-center justify-between bg-card p-4 rounded-lg border flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          {/* Language Selector */}
          <Select value={selectedLanguage} onValueChange={(value: Language) => setSelectedLanguage(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableLanguages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {languageLabels[lang]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Audio Controls - Only show if current page has audio */}
          {currentPageAudio ? (
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={toggleAudio}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={toggleMute}>
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleResetAudio}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              🔇 Audio tidak tersedia untuk halaman ini
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Bookmark */}
          <Button variant="outline" size="sm" onClick={toggleBookmark}>
            {bookmarks.includes(currentPage) ? (
              <BookmarkCheck className="h-4 w-4 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>

          {/* Settings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Ukuran Teks</label>
                  <Slider
                    value={[fontSize]}
                    onValueChange={(value) => setFontSize(value[0])}
                    min={12}
                    max={24}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground mt-1">{fontSize}px</div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Font</label>
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sans">Sans Serif</SelectItem>
                      <SelectItem value="serif">Serif</SelectItem>
                      <SelectItem value="mono">Monospace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Per-Page Audio Player */}
      {currentPageAudio && (
        <Card className="bg-slate-50 dark:bg-slate-900 border">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max={audioDuration || 0}
                    value={audioProgress}
                    onChange={handleProgressChange}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTime(audioProgress)} / {formatTime(audioDuration)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                🔊 Audio narasi tersedia untuk halaman ini
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Book Reader */}
      <Card className="min-h-[500px] relative overflow-hidden">
        <CardContent className="p-8">
          {/* Book Pages */}
          <div className="relative">
            <div
              className={cn(
                "transition-all duration-300 ease-in-out",
                isPageTurning && "transform scale-95 opacity-50",
              )}
            >
              {/* Cover Page */}
              {isCoverPage ? (
                <div className="text-center space-y-6">
                  <h1 className="text-4xl font-bold text-foreground">{story.title}</h1>
                  <div>
                    <img
                      src={currentPageIllustration}
                      alt={`Cover: ${story.title}`}
                      className="w-64 h-80 object-cover mx-auto rounded-lg shadow-lg"
                    />
                  </div>
                  <div className="text-muted-foreground">
                    <p className="text-sm">Penulis: {story.authorName}</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Story Illustration */}
                  {currentPageIllustration && (
                    <div className="mb-6 text-center">
                      <img
                        src={currentPageIllustration || "/placeholder.svg"}
                        alt={`Ilustrasi halaman ${currentPageData?.pageNumber || currentPage}`}
                        className="max-w-full h-64 object-contain mx-auto rounded-lg"
                      />
                    </div>
                  )}

                  {/* Story Text */}
                  <div
                    className={cn(
                      "text-center leading-relaxed",
                      fontFamily === "serif" && "font-serif",
                      fontFamily === "mono" && "font-mono",
                      fontFamily === "sans" && "font-sans",
                    )}
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {currentPageText.split(" ").map((word, index) => (
                      <span
                        key={index}
                        className={cn(
                          "transition-colors duration-200",
                          highlightedWord === index && "bg-primary/20 text-primary font-medium",
                        )}
                      >
                        {word}{" "}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={goToPreviousPage}
              disabled={currentPage === 0}
              className="flex items-center space-x-2 bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Sebelumnya</span>
            </Button>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Halaman {currentPage + 1} dari {totalPages}
              </span>
              <div className="w-32 bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
                />
              </div>
            </div>

            <Button
              variant="outline"
              onClick={goToNextPage}
              disabled={currentPage === totalPages - 1}
              className="flex items-center space-x-2 bg-transparent"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookmarks Panel */}
      {bookmarks.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">Bookmark Tersimpan</h3>
            <div className="flex flex-wrap gap-2">
              {bookmarks.map((pageNum) => (
                <Button
                  key={pageNum}
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="text-xs"
                >
                  Halaman {pageNum + 1}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}