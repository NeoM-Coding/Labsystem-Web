import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthState {
  token: string | null
  user: User | null
  setSession: (token: string, user: User) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(persist(
  (set) => ({
    token: null,
    user: null,
    setSession: (token, user) => set({ token, user }),
    clearSession: () => set({ token: null, user: null }),
  }),
  {
    name: 'lab-auth',
    partialize: (state) => ({
      user: state.user ? {
        id: state.user.id,
        name: state.user.name,
        username: state.user.username,
        roles: state.user.roles,
      } : null,
      token: null,
    }),
  },
))
