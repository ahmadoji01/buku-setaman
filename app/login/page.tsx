"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth"
import Link from "next/link"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const success = await login(formData.email, formData.password)
      if (success) {
        router.push("/dashboard")
      } else {
        alert("Email atau password salah")
      }
    } catch (error) {
      alert("Terjadi kesalahan saat login")
    } finally {
      setIsLoading(false)
    }
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
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Masuk..." : "Masuk"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>Demo Login:</p>
              <p>Email: admin@bukusetaman.com</p>
              <p>Password: admin123</p>
              <p className="mt-2 text-xs">or</p>
              <p>Email: sari@teacher.com</p>
              <p>Password: teacher123</p>
            </div>
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
