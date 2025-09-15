import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    </div>
  )
}
