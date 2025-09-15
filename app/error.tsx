"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-24 w-24 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Terjadi Kesalahan</h1>
        <p className="text-muted-foreground mb-8">
          Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi atau hubungi administrator jika masalah
          berlanjut.
        </p>

        <Button onClick={reset} className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Coba Lagi
        </Button>
      </div>
    </div>
  )
}
