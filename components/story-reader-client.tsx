'use client'

import { BookReader } from "@/components/book-reader"
import { Story } from "@/lib/types"

interface StoryReaderClientProps {
  story: Story
}

export function StoryReaderClient({ story }: StoryReaderClientProps) {
  const handleProgressUpdate = (progress: any) => {
    // In a real app, this would save to database
    console.log("Progress updated:", progress)
  }

  return (
    <div className="py-8">
      <BookReader story={story} onProgressUpdate={handleProgressUpdate} />
    </div>
  )
}
