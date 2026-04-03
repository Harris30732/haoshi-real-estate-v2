'use client'

import { create } from 'zustand'
import { User } from '@/types/user'
import { AUTH_CONFIG } from '@/lib/auth-config'
import { API_BASE, ENDPOINTS } from '@/lib/constants'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credential: string) => Promise<void>
  loginDemo: () => void
  logout: () => void
  checkAuth: () => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  checkAuth: () => {
    try {
      const stored = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.USER)
      if (stored) {
        const user = JSON.parse(stored) as User
        set({ user, isAuthenticated: true, isLoading: false })
      } else {
        set({ isLoading: false })
      }
    } catch {
      set({ isLoading: false })
    }
  },

  login: async (credential: string) => {
    try {
      const res = await fetch(`${API_BASE}${ENDPOINTS.AUTH_GOOGLE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      })

      if (!res.ok) throw new Error('Login failed')

      const data = await res.json()
      const user: User = {
        id: data.id || data.user_id || '',
        name: data.name || '',
        email: data.email || '',
        title: data.title || null,
        role: data.role || 'user',
        is_active: data.is_active !== false,
        picture: data.picture || null,
        last_login: new Date().toISOString(),
        created_at_source: null,
        updated_at_source: null,
      }

      localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.TOKEN, data.token || credential)
      localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.USER, JSON.stringify(user))
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  loginDemo: () => {
    const demoUser: User = {
      id: 'demo-001',
      name: 'Demo Admin',
      email: 'demo@haoshi.com',
      title: '系統管理員',
      role: 'admin',
      is_active: true,
      picture: null,
      last_login: new Date().toISOString(),
      created_at_source: null,
      updated_at_source: null,
    }
    localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.TOKEN, 'demo-token')
    localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.USER, JSON.stringify(demoUser))
    set({ user: demoUser, isAuthenticated: true, isLoading: false })
  },

  logout: () => {
    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.TOKEN)
    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.USER)
    set({ user: null, isAuthenticated: false })
  },
}))
