"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AcknowledgementsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <h1 className="text-4xl font-bold text-foreground mb-2">Ucapan Terima Kasih</h1>
        <p className="text-lg text-muted-foreground">Apresiasi kami kepada semua pihak yang mendukung proyek ini</p>
      </div>

      <div className="space-y-6">
        {/* Kemdiktisaintek */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">
                  <img src="logo-diktisaintek.png" max-width="100px" height="auto"></img>
                </span>
              </div>
              Direktorat Jenderal Riset dan Pengembangan melalui Direktorat Penelitian dan Pengabdian kepada Masyarakat (DPPM) Kementerian Pendidikan Tinggi, Sains, dan Teknologi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Buku Setaman adalah proyek yang didukung penuh melalui Program Hibah Pengabdian kepada Masyarakat dari Direktorat Jenderal Riset dan Pengembangan melalui Direktorat Penelitian dan Pengabdian kepada Masyarakat (DPPM) Kementerian Pendidikan Tinggi, Sains, dan Teknologi. Dukungan ini memungkinkan kami untuk mengembangkan platform inovatif yang memberdayakan
              guru-guru Indonesia untuk menciptakan konten edukatif berkualitas tinggi dengan dukungan teknologi AI.
            </p>
            <p className="text-sm text-muted-foreground">
              Kami berterima kasih kepada Kemdiktisaintek atas kepercayaan dan komitmen terhadap pengembangan pendidikan
              di Indonesia yang lebih baik.
            </p>
          </CardContent>
        </Card>

        {/* Universitas Suryakancana */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">
                  <img src="logo-unsur.png" max-width="100px" height="auto"></img>
                </span>
              </div>
              Universitas Suryakancana dan LPPM
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Kami mengucapkan terima kasih yang sebesar-besarnya kepada Universitas Suryakancana, khususnya Lembaga
              Penelitian dan Pengabdian Masyarakat (LPPM), yang telah memberikan akomodasi, dukungan infrastruktur, dan
              lingkungan akademis yang kondusif untuk mengembangkan proyek Buku Setaman.
            </p>
            <p className="text-sm text-muted-foreground">
              Partisipasi aktif LPPM dalam memfasilitasi penelitian dan pengabdian masyarakat telah menjadi kunci
              kesuksesan proyek ini.
            </p>
          </CardContent>
        </Card>

        {/* About the Project */}
        <Card>
          <CardHeader>
            <CardTitle>Tentang Proyek Ini</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Buku Setaman adalah platform cerita edukatif yang memanfaatkan teknologi kecerdasan buatan (AI) untuk
              membantu guru membuat konten pembelajaran interaktif dalam berbagai bahasa, termasuk Bahasa Indonesia, Basa
              Sunda, dan Bahasa Inggris.
            </p>
            <p className="text-sm text-muted-foreground">
              Misi kami adalah memberdayakan pendidik untuk menciptakan pengalaman belajar yang menarik, interaktif, dan
              inklusif bagi semua siswa di Indonesia.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}