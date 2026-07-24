import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthState {
  user: User | null
  setSession: (user: User) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(persist(
  (set) => ({
    user: null,
    setSession: (user) => set({ user }),
    clearSession: () => set({ user: null }),
  }),
  {
    name: 'lab-auth',
    version: 1,
    migrate: (persistedState) => {
      const persisted = persistedState as { user?: User | null } | undefined
      return {
        user: persisted?.user ? {
          id: persisted.user.id,
          name: persisted.user.name,
          username: persisted.user.username,
          roles: persisted.user.roles,
        } : null,
      }
    },
    partialize: (state) => ({
      user: state.user ? {
        id: state.user.id,
        name: state.user.name,
        username: state.user.username,
        roles: state.user.roles,
      } : null,
    }),
  },
))
