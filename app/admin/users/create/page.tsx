"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, User, Lock, Shield } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import type { UserRole } from "@/lib/types"

export default function CreateUserPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "teacher" as UserRole,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Akses Ditolak</h1>
          <p className="text-muted-foreground">Anda harus masuk sebagai admin untuk menambah pengguna.</p>
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

    if (!formData.password) {
      newErrors.password = "Password wajib diisi"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password minimal 6 karakter"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password tidak cocok"
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
      const newUser = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      console.log("User created:", newUser)
      setIsLoading(false)
      router.push("/admin")
    }, 1000)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Admin Panel
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-2">Tambah Pengguna Baru</h1>
        <p className="text-lg text-muted-foreground">Buat akun baru untuk guru atau admin</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Informasi Dasar
            </CardTitle>
            <CardDescription>Masukkan informasi dasar pengguna</CardDescription>
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

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="mr-2 h-5 w-5" />
              Keamanan
            </CardTitle>
            <CardDescription>Atur password dan hak akses pengguna</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Konfirmasi Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Ulangi password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className={errors.confirmPassword ? "border-destructive" : ""}
              />
              {errors.confirmPassword && <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>}
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
            <CardDescription>Pilih role dan hak akses pengguna</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value: UserRole) => handleInputChange("role", value)}>
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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Menyimpan..." : "Buat Pengguna"}
          </Button>
          <Button asChild type="button" variant="outline" className="flex-1 bg-transparent">
            <Link href="/admin">Batal</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
