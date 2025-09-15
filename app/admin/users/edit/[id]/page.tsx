"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, User, Shield, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { mockUsers } from "@/lib/mock-data"
import type { UserRole } from "@/lib/types"

interface EditUserPageProps {
  params: {
    id: string
  }
}

export default function EditUserPage({ params }: EditUserPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [targetUser, setTargetUser] = useState(mockUsers.find((u) => u.id === params.id))

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "teacher" as UserRole,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (targetUser) {
      setFormData({
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      })
    }
  }, [targetUser])

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Akses Ditolak</h1>
          <p className="text-muted-foreground">Anda harus masuk sebagai admin untuk mengedit pengguna.</p>
        </div>
      </div>
    )
  }

  if (!targetUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Pengguna Tidak Ditemukan</h1>
          <p className="text-muted-foreground">Pengguna yang Anda cari tidak ditemukan.</p>
          <Button asChild className="mt-4">
            <Link href="/admin/users">Kembali ke Daftar Pengguna</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Nama wajib diisi"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email wajib diisi"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format email tidak valid"
    }

    if (!formData.role) {
      newErrors.role = "Role wajib dipilih"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    // Simulate save operation
    setTimeout(() => {
      const updatedUser = {
        ...targetUser,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        updatedAt: new Date(),
      }

      console.log("User updated:", updatedUser)
      setIsLoading(false)
      router.push("/admin/users")
    }, 1000)
  }

  const isEditingSelf = user.id === targetUser.id

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Pengguna
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-2">Edit Pengguna</h1>
        <p className="text-lg text-muted-foreground">Edit informasi pengguna {targetUser.name}</p>
      </div>

      {isEditingSelf && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Anda sedang mengedit profil Anda sendiri. Berhati-hatilah saat mengubah role atau informasi penting lainnya.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Informasi Dasar
            </CardTitle>
            <CardDescription>Edit informasi dasar pengguna</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nama Lengkap *</Label>
              <Input
                id="name"
                placeholder="Masukkan nama lengkap..."
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="contoh@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Role Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Hak Akses
            </CardTitle>
            <CardDescription>Edit role dan hak akses pengguna</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: UserRole) => handleInputChange("role", value)}
                disabled={isEditingSelf}
              >
                <SelectTrigger className={errors.role ? "border-destructive" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Guru</div>
                        <div className="text-xs text-muted-foreground">Dapat membuat dan mengelola cerita</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Admin</div>
                        <div className="text-xs text-muted-foreground">Akses penuh ke sistem</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-sm text-destructive mt-1">{errors.role}</p>}
              {isEditingSelf && (
                <p className="text-sm text-muted-foreground mt-1">
                  Anda tidak dapat mengubah role Anda sendiri untuk keamanan sistem.
                </p>
              )}
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                {formData.role === "admin"
                  ? "Admin memiliki akses penuh untuk mengelola pengguna, modul, dan sistem."
                  : "Guru dapat membuat cerita, mengakses modul pelatihan, dan mengelola konten mereka."}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Akun</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong className="text-foreground">Bergabung:</strong>
                <p className="text-muted-foreground">{targetUser.createdAt.toLocaleDateString("id-ID")}</p>
              </div>
              <div>
                <strong className="text-foreground">Terakhir Diperbarui:</strong>
                <p className="text-muted-foreground">{targetUser.updatedAt.toLocaleDateString("id-ID")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
          <Button asChild type="button" variant="outline" className="flex-1 bg-transparent">
            <Link href="/admin/users">Batal</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
