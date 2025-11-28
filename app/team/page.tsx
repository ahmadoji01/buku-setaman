"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TeamMember {
  name: string
  role: string
  description: string
  avatar?: string
}

const teamMembers: TeamMember[] = [
  {
    name: "Dr. Nama Ketua Tim",
    role: "Ketua Tim / Peneliti Utama",
    description:
      "Pemimpin proyek dengan expertise dalam teknologi pendidikan dan pengembangan platform digital. Bertanggung jawab atas visi keseluruhan dan strategi pengembangan Buku Setaman.",
  },
  {
    name: "Nama Anggota Tim 1",
    role: "Anggota Tim / Pengembang",
    description:
      "Spesialis dalam pengembangan teknologi AI dan backend system. Memastikan infrastruktur platform berjalan optimal dan inovasi teknologi terlaksana dengan baik.",
  },
  {
    name: "Nama Anggota Tim 2",
    role: "Anggota Tim / Desainer & Peneliti",
    description:
      "Ahli dalam desain user experience dan penelitian pendidikan. Memastikan platform user-friendly dan disesuaikan dengan kebutuhan pendidik serta siswa Indonesia.",
  },
]

export default function TeamPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <h1 className="text-4xl font-bold text-foreground mb-2">Tim Buku Setaman</h1>
        <p className="text-lg text-muted-foreground">
          Bertemu dengan tim berdedikasi di balik pengembangan platform Buku Setaman
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {teamMembers.map((member, index) => (
          <Card key={index} className="text-center overflow-hidden hover:shadow-lg transition-shadow">
            <div className="w-full h-48 bg-gradient-to-b from-primary/20 to-primary/10 flex items-center justify-center">
              <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-4xl">
                👤
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-xl">{member.name}</CardTitle>
              <p className="text-sm text-primary font-medium">{member.role}</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{member.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-12 bg-muted/50">
        <CardHeader>
          <CardTitle>Tentang Tim Kami</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Tim Buku Setaman terdiri dari para profesional berpengalaman di bidang teknologi, pendidikan, dan desain.
            Kami berkomitmen untuk menciptakan solusi inovatif yang memberdayakan guru-guru Indonesia dalam mengembangkan
            konten pembelajaran yang lebih menarik dan interaktif.
          </p>
          <p className="text-muted-foreground">
            Dengan dukungan dari Universitas Suryakancana dan pendanaan dari Program Hibah Kemdiktisaintek, kami terus
            berinovasi untuk meningkatkan kualitas pendidikan di Indonesia.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}