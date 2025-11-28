"use client"

import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { BookOpen, Microscope } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-muted/50 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Buku Setaman</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Platform cerita edukatif dengan teknologi AI untuk guru dan siswa Indonesia.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Navigasi</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/stories" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Cerita
                </Link>
              </li>
              <li>
                <Link href="/team" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Tim
                </Link>
              </li>
              <li>
                <Link href="/acknowledgements" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Tanda Terima
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Masuk
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Dukungan</h3>
            <ul className="space-y-2">
              <li>
                <a href="mailto:support@bukusetaman.id" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Hubungi Kami
                </a>
              </li>
            </ul>
          </div>

          {/* Funding */}
          <div>
            <h3 className="font-semibold mb-4">Didukung Oleh</h3>
            <p className="text-sm text-muted-foreground mb-2">Program Hibah Pengabdian Masyarakat</p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 h-10 bg-white/50 rounded px-2">
                <span className="text-xs font-semibold text-muted-foreground">Kemdiktisaintek</span>
              </div>
              <div className="flex items-center gap-2 h-10 bg-white/50 rounded px-2">
                <span className="text-xs font-semibold text-muted-foreground">Universitas Suryakancana</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="mb-8">
          <h3 className="font-semibold mb-8 text-center">Mitra dan Pendukung</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-items-center">
            <div className="flex items-center justify-center h-20 w-32 p-4">
              <div className="text-center">
                <div className="text-2xl mb-1">
                  <img src="logo-diktisaintek.png" max-width="100px" height="auto"></img>
                </div>
                <span className="text-xs font-semibold text-muted-foreground text-center line-clamp-2">Kemdiktisaintek</span>
              </div>
            </div>

            <div className="flex items-center justify-center h-20 w-32 p-4">
              <div className="text-center">
                <div className="text-2xl mb-1">
                  <img src="logo-unsur.png" max-width="100px" height="auto"></img>
                </div>
                <span className="text-xs font-semibold text-muted-foreground text-center line-clamp-2">Universitas Suryakancana</span>
              </div>
            </div>

            <div className="flex items-center justify-center h-20 w-32 p-4">
              <div className="text-center">
                <div className="text-2xl mb-1">
                  <Microscope size={100} />
                </div>
                <span className="text-xs font-semibold text-muted-foreground text-center line-clamp-2">LPPM UNSUR</span>
              </div>
            </div>

            <div className="flex items-center justify-center h-20 w-32 p-4">
              <div className="text-center">
                <img src="icon.png" max-width="100px" height="auto"></img>
                <span className="text-xs font-semibold text-primary">Buku Setaman</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Buku Setaman. Semua hak cipta dilindungi.</p>
        </div>
      </div>
    </footer>
  )
}