import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <BookOpen className="h-24 w-24 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
          <h2 className="text-xl font-semibold text-foreground mb-4">Halaman Tidak Ditemukan</h2>
          <p className="text-muted-foreground mb-8">
            Maaf, halaman yang Anda cari tidak dapat ditemukan. Mungkin halaman tersebut telah dipindahkan atau dihapus.
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Kembali ke Beranda
            </Link>
          </Button>

          <Button variant="outline" asChild className="w-full bg-transparent">
            <Link href="/stories">
              <BookOpen className="mr-2 h-4 w-4" />
              Jelajahi Cerita
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
