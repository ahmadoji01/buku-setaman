"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Users, Shield, User, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { mockUsers } from "@/lib/mock-data"
import type { User as UserType } from "@/lib/types"

export default function UsersManagementPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserType[]>(mockUsers)
  const [searchTerm, setSearchTerm] = useState("")

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Akses Ditolak</h1>
          <p className="text-muted-foreground">Anda harus masuk sebagai admin untuk mengelola pengguna.</p>
        </div>
      </div>
    )
  }

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter((u) => u.id !== userId))
  }

  const filteredUsers = users.filter(
    (userData) =>
      userData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userData.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getRoleBadge = (role: string) => {
    return role === "admin" ? (
      <Badge className="bg-primary text-primary-foreground">
        <Shield className="h-3 w-3 mr-1" />
        Admin
      </Badge>
    ) : (
      <Badge variant="secondary">
        <User className="h-3 w-3 mr-1" />
        Guru
      </Badge>
    )
  }

  const getRoleIcon = (role: string) => {
    return role === "admin" ? <Shield className="h-5 w-5 text-primary" /> : <User className="h-5 w-5 text-secondary" />
  }

  const adminCount = users.filter((u) => u.role === "admin").length
  const teacherCount = users.filter((u) => u.role === "teacher").length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Admin Panel
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Manajemen Pengguna</h1>
            <p className="text-lg text-muted-foreground">Kelola akun guru dan admin</p>
          </div>
          <Button asChild>
            <Link href="/admin/users/create">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Pengguna
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">Semua pengguna aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{adminCount}</div>
            <p className="text-xs text-muted-foreground">Administrator sistem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guru</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{teacherCount}</div>
            <p className="text-xs text-muted-foreground">Guru aktif</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari pengguna berdasarkan nama atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.map((userData) => (
          <Card key={userData.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    {getRoleIcon(userData.role)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="font-semibold text-foreground">{userData.name}</h3>
                      {getRoleBadge(userData.role)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{userData.email}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>Bergabung: {userData.createdAt.toLocaleDateString("id-ID")}</span>
                      <span>Terakhir update: {userData.updatedAt.toLocaleDateString("id-ID")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/users/edit/${userData.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      {userData.id !== user.id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Pengguna</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus pengguna "{userData.name}"? Tindakan ini tidak dapat
                                dibatalkan dan akan menghapus semua data terkait.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(userData.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchTerm ? "Pengguna Tidak Ditemukan" : "Belum Ada Pengguna"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Coba gunakan kata kunci yang berbeda" : "Mulai dengan menambahkan pengguna pertama"}
            </p>
            {!searchTerm && (
              <Button asChild>
                <Link href="/admin/users/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Pengguna
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
