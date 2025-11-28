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
    name: "Dr. Aan Hasanah, S.Pd, M.Pd",
    role: "Ketua Tim",
    description:
      "Dr. Aan Hasanah adalah pendidik dan peneliti di bidang Pendidikan Bahasa dan Sastra Indonesia. Ia meraih gelar S-1 dan S-2 dari Universitas Suryakancana serta gelar doktor dari Universitas Pendidikan Indonesia. Berpengalaman sebagai dosen, pengembang kurikulum, dan asesor beban kerja dosen, Dr. Aan kini menjabat sebagai Ketua Program Studi Magister PBSI. Ia aktif menulis artikel ilmiah, buku, dan antologi puisi, serta memperoleh hibah penelitian disertasi doktor. Minatnya mencakup sastra lisan dan transformasi sastra daerah, dengan karya seperti Tradisi Bertani di Tatar Sunda dan Toponimi Kabupaten Cianjur.",
  },
  {
    name: "Dr. Nia Kurniawati, S.Pd, M.Pd",
    role: "Anggota Tim",
    description:
      "Dr. Nia Kurniawati, M.Pd., adalah dosen di Program Pascasarjana Universitas Suryakancana, sekaligus Founder Skybridge Learning Center. Ia memiliki latar belakang pendidikan Bahasa Inggris dengan gelar sarjana dan magister dari Universitas Pendidikan Indonesia, serta doktor Linguistik Terapan dari Universitas Negeri Jakarta. Berpengalaman sebagai instruktur, dosen, dan koordinator pusat kajian literasi, Dr. Nia aktif menjadi presenter di konferensi internasional, penulis artikel ilmiah terindeks Scopus, serta pegiat literasi. Ia juga dikenal sebagai MC dan kontributor media cetak.",
  },
  {
    name: "Aprilla Adawiyah, S.Pd, M.Pd",
    role: "Anggota Tim",
    description:
      "Aprilla Adawiyah, S.Pd, M.Pd adalah pendidik yang aktif dalam dunia literasi anak dan sastra. Ia bergabung dalam berbagai organisasi seperti Asosiasi Linguistik Terapan Indonesia dan Persatuan Pengajar Bahasa Indonesia, serta komunitas literasi Cianjur Read Aloud. Aprilla memiliki banyak karya, termasuk buku cerita anak dwibahasa yang diterbitkan oleh Kemendikbudristek, seperti Taci Ngalalana dan Aira Bisa Ngibing. Prestasinya meliputi penulis naskah terpilih dalam sayembara cerita anak berbahasa daerah dan lolos kurasi TPN X. Ia berkomitmen mengembangkan literasi berbasis kearifan lokal.",
  },
  {
    name: "Ahmad Ridwan Fauzi, S.Kom, M.Sc, MBA",
    role: "Anggota Tim",
    description:
      "Ahmad Ridwan Fauzi, S.Kom, M.Sc, MBA adalah lulusan Teknik Informatika ITS dan meraih gelar M.Sc. di Hokkaido University serta MBA dari EDHEC Business School. Berpengalaman lebih dari 6 tahun dalam pengembangan bisnis dan teknologi, termasuk sebagai co-founder startup di Jepang dan software engineer di sektor fintech. Saat ini menjabat sebagai Operating Director PT Envision Lab Studio, mengembangkan solusi berbasis LLM untuk industri manufaktur dan pendidikan. Aktif sebagai dosen di Telkom University Jakarta.",
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