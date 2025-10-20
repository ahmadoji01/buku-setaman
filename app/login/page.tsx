"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth"
import Link from "next/link"
import Image from "next/image"
import { AlertCircle, Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Validate inputs
      if (!formData.email.trim()) {
        setError("Email tidak boleh kosong")
        setIsLoading(false)
        return
      }

      if (!formData.password.trim()) {
        setError("Password tidak boleh kosong")
        setIsLoading(false)
        return
      }

      const success = await login(formData.email, formData.password)
      if (success) {
        router.push("/dashboard")
      } else {
        setError("Email atau password salah")
      }
    } catch (error) {
      setError("Terjadi kesalahan saat login. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Memverifikasi sesi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bukusetaman_LOGO%201-SAfu3JusbecrIKUuz9wOccog1CVjIX.png"
            alt="Buku Setaman"
            width={200}
            height={60}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-foreground">Masuk ke Akun Anda</h1>
          <p className="text-muted-foreground">Akses dashboard guru dan kelola cerita Anda</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Masukkan email dan password untuk melanjutkan</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="guru@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Masuk...
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <Button asChild variant="ghost">
            <Link href="/">Kembali ke Beranda</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}