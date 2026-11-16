import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthState } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

async function fetchWithError(url: string, options: RequestInit) {
  try {
    const res = await fetch(url, options)
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(err.error || `HTTP ${res.status}`)
    }
    return res.json()
  } catch (e) {
    if (e instanceof TypeError && e.message === 'Failed to fetch') {
      throw new Error(`Cannot connect to API at ${API_URL}. Is the backend running?`)
    }
    throw e
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const data = await fetchWithError(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        set({ user: data.user, token: data.token, isAuthenticated: true })
      },

      register: async (email: string, password: string, name: string) => {
        const data = await fetchWithError(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        })
        set({ user: data.user, token: data.token, isAuthenticated: true })
      },

      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage', partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }) }
  )
)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return children
}