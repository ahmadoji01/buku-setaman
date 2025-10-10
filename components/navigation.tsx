"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { useAuth } from "@/lib/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, BookOpen, Settings, LogOut, Users, GraduationCap } from "lucide-react"

export function Navigation() {
  const { user, logout, hasRole } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bukusetaman_LOGO%201-SAfu3JusbecrIKUuz9wOccog1CVjIX.png"
              alt="Buku Setaman"
              width={140}
              height={45}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/stories" className="text-foreground hover:text-primary transition-colors">
              Cerita
            </Link>

            {user && hasRole("teacher") && (
              <>
                <Link href="/dashboard" className="text-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link href="/modules" className="text-foreground hover:text-primary transition-colors">
                  Modul Pelatihan
                </Link>
              </>
            )}

            {user && hasRole("admin") && (
              <>
                <Link href="/admin" className="text-foreground hover:text-primary transition-colors">
                  Admin Panel
                </Link>
                <Link href="/modules" className="text-foreground hover:text-primary transition-colors">
                  Kelola Modul
                </Link>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4 relative">
            {user ? (
              <DropdownMenu onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                    type="button"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user.name}</span>
                  </button>
                </DropdownMenuTrigger>

                {/* Portal to ensure proper rendering */}
                <DropdownMenuContent
                  align="end"
                  className="w-56 z-[9999] min-w-[200px]"
                  sideOffset={8}
                  avoidCollisions={true}
                >
                  {/* Debug indicator */}
                  <div className="px-2 py-1 text-xs text-muted-foreground border-b">
                    Dropdown {isDropdownOpen ? 'OPEN' : 'CLOSED'}
                  </div>
                  <div className="px-2 py-1.5 text-sm font-medium">{user.name}</div>
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {user.role === "admin" ? "Administrator" : user.role === "teacher" ? "Guru" : "Pengguna"}
                  </div>
                  <DropdownMenuSeparator />

                  {hasRole("teacher") && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="flex items-center">
                          <BookOpen className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/modules" className="flex items-center">
                          <GraduationCap className="mr-2 h-4 w-4" />
                          Modul Pelatihan
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {hasRole("admin") && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/users" className="flex items-center">
                          <Users className="mr-2 h-4 w-4" />
                          Kelola Pengguna
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                <Link href="/login" className="text-primary-foreground">Masuk</Link>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
