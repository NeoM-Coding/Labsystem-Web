import { create } from 'zustand'
import type { ManagedUser } from '../types'

interface AccountState {
  usersById: Record<string, ManagedUser>
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  setLoading: () => void
  replaceUsers: (users: ManagedUser[]) => void
  upsertUser: (user: ManagedUser) => void
  setError: (message: string) => void
  clear: () => void
}

export const useAccountStore = create<AccountState>((set) => ({
  usersById: {},
  status: 'idle',
  error: null,
  setLoading: () => set({ status: 'loading', error: null }),
  replaceUsers: (users) => set({
    usersById: Object.fromEntries(users.map((user) => [user.id, user])),
    status: 'ready',
    error: null,
  }),
  upsertUser: (user) => set((state) => ({
    usersById: { ...state.usersById, [user.id]: user },
    status: 'ready',
    error: null,
  })),
  setError: (message) => set({ status: 'error', error: message }),
  clear: () => set({ usersById: {}, status: 'idle', error: null }),
}))
