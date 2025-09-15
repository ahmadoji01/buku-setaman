"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User, UserRole } from "./types"
import { getCurrentUser, getUserById } from "./mock-data"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  hasRole: (role: UserRole) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check for stored user session
    const storedUserId = localStorage.getItem("userId")
    if (storedUserId) {
      const foundUser = getUserById(storedUserId)
      if (foundUser) {
        setUser(foundUser)
        setIsAuthenticated(true)
      }
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simple mock authentication
    const foundUser = getCurrentUser() // For demo, always return teacher
    if (foundUser) {
      setUser(foundUser)
      setIsAuthenticated(true)
      localStorage.setItem("userId", foundUser.id)
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("userId")
  }

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
