import { create } from 'zustand'
import {
  createLaboratory,
  deleteLaboratory,
  getLaboratories,
  updateLaboratory,
} from '../api/laboratories'
import type { Laboratory, LaboratoryDraft } from '../types'

interface LaboratoryState {
  laboratoriesById: Record<string, Laboratory>
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  load: () => Promise<void>
  create: (draft: LaboratoryDraft) => Promise<Laboratory>
  update: (laboratoryId: string, draft: LaboratoryDraft) => Promise<Laboratory>
  remove: (laboratoryId: string) => Promise<void>
  upsertLocal: (laboratory: Laboratory) => void
  removeLocal: (laboratoryId: string) => void
  hydratePreview: (laboratories: Laboratory[]) => void
  reset: () => void
}

const index = (items: Laboratory[]) => Object.fromEntries(items.map((item) => [item.id, item]))

export const useLaboratoryStore = create<LaboratoryState>((set) => ({
  laboratoriesById: {},
  status: 'idle',
  error: null,
  load: async () => {
    set({ status: 'loading', error: null })
    try {
      const laboratories = await getLaboratories([], [])
      set({ laboratoriesById: index(laboratories), status: 'ready' })
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : '实验室加载失败'
      set({ status: 'error', error: message })
      throw cause
    }
  },
  create: async (draft) => {
    const laboratory = await createLaboratory(draft)
    set((state) => ({
      laboratoriesById: { ...state.laboratoriesById, [laboratory.id]: laboratory },
    }))
    return laboratory
  },
  update: async (laboratoryId, draft) => {
    const laboratory = await updateLaboratory(laboratoryId, draft)
    set((state) => ({
      laboratoriesById: { ...state.laboratoriesById, [laboratoryId]: laboratory },
    }))
    return laboratory
  },
  remove: async (laboratoryId) => {
    await deleteLaboratory(laboratoryId)
    set((state) => {
      const laboratoriesById = { ...state.laboratoriesById }
      delete laboratoriesById[laboratoryId]
      return { laboratoriesById }
    })
  },
  upsertLocal: (laboratory) => set((state) => ({
    laboratoriesById: { ...state.laboratoriesById, [laboratory.id]: laboratory },
  })),
  removeLocal: (laboratoryId) => set((state) => {
    const laboratoriesById = { ...state.laboratoriesById }
    delete laboratoriesById[laboratoryId]
    return { laboratoriesById }
  }),
  hydratePreview: (laboratories) => set({
    laboratoriesById: index(laboratories),
    status: 'ready',
    error: null,
  }),
  reset: () => set({ laboratoriesById: {}, status: 'idle', error: null }),
}))
