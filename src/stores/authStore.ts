import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthState } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        if (!res.ok) throw new Error('Invalid credentials')
        const { user, token } = await res.json()
        set({ user, token, isAuthenticated: true })
      },

      register: async (email: string, password: string, name: string) => {
        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        })
        if (!res.ok) throw new Error('Registration failed')
        const { user, token } = await res.json()
        set({ user, token, isAuthenticated: true })
      },

      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage', partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }) }
  )
)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return children
}