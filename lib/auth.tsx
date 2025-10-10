"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User, UserRole } from "./types"

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
      // Check if user is still authenticated via API
      fetch('/api/auth/me')
        .then((response) => response.json())
        .then((data) => {
          if (data.user) {
            setUser(data.user)
            setIsAuthenticated(true)
          } else {
            // Clear invalid session
            localStorage.removeItem("userId")
          }
        })
        .catch((error) => {
          console.error('Session check error:', error)
          localStorage.removeItem("userId")
        })
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUser(data.user)
        setIsAuthenticated(true)
        localStorage.setItem("userId", data.user.email) // Store email for session
        return true
      }

      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = () => {
    // Call logout API to clear server-side session
    fetch('/api/auth/logout', { method: 'POST' })
      .catch((error) => console.error('Logout error:', error))
      .finally(() => {
        setUser(null)
        setIsAuthenticated(false)
        localStorage.removeItem("userId")
      })
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
