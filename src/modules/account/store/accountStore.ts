import { create } from 'zustand'
import type { ManagedUser } from '../types'

interface AccountState {
  recentUsers: ManagedUser[]
  record: (user: ManagedUser) => void
  clear: () => void
}

export const useAccountStore = create<AccountState>((set) => ({
  recentUsers: [],
  record: (user) => set((state) => ({
    recentUsers: [user, ...state.recentUsers.filter((item) => item.id !== user.id)].slice(0, 8),
  })),
  clear: () => set({ recentUsers: [] }),
}))
