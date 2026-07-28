import { create } from 'zustand'
import {
  createStrategy,
  deleteStrategy,
  getStrategy,
  listStrategies,
  setStrategyEnabled,
  updateStrategy,
} from '../api/strategies'
import type { RuntimeRevision } from '../types'

interface StrategyState {
  revisionsById: Record<string, RuntimeRevision>
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  load: () => Promise<void>
  get: (runtimeId: string) => Promise<RuntimeRevision>
  create: (revision: RuntimeRevision) => Promise<RuntimeRevision>
  update: (runtimeId: string, revision: RuntimeRevision) => Promise<RuntimeRevision>
  remove: (runtimeId: string) => Promise<void>
  setEnabled: (runtimeId: string, enabled: boolean) => Promise<void>
  hydratePreview: (revisions: RuntimeRevision[]) => void
  upsertLocal: (revision: RuntimeRevision) => void
  removeLocal: (runtimeId: string) => void
  reset: () => void
}

const index = (items: RuntimeRevision[]) => Object.fromEntries(items.map((item) => [item.runtimeId, item]))

export const useStrategyStore = create<StrategyState>((set, get) => ({
  revisionsById: {},
  status: 'idle',
  error: null,
  load: async () => {
    set({ status: 'loading', error: null })
    try {
      const revisions = await listStrategies()
      set({ revisionsById: index(revisions), status: 'ready' })
    } catch (cause) {
      set({
        status: 'error',
        error: cause instanceof Error ? cause.message : '加载智能策略失败',
      })
      throw cause
    }
  },
  get: async (runtimeId) => {
    const revision = await getStrategy(runtimeId)
    set((state) => ({
      revisionsById: { ...state.revisionsById, [runtimeId]: revision },
    }))
    return revision
  },
  create: async (revision) => {
    const saved = await createStrategy(revision)
    set((state) => ({ revisionsById: { ...state.revisionsById, [saved.runtimeId]: saved } }))
    return saved
  },
  update: async (runtimeId, revision) => {
    const saved = await updateStrategy(runtimeId, revision)
    set((state) => ({ revisionsById: { ...state.revisionsById, [runtimeId]: saved } }))
    return saved
  },
  remove: async (runtimeId) => {
    await deleteStrategy(runtimeId)
    get().removeLocal(runtimeId)
  },
  setEnabled: async (runtimeId, enabled) => {
    const previous = get().revisionsById[runtimeId]
    if (!previous) return
    set((state) => ({
      revisionsById: {
        ...state.revisionsById,
        [runtimeId]: { ...previous, enabled },
      },
    }))
    try {
      const saved = await setStrategyEnabled(runtimeId, enabled)
      set((state) => ({ revisionsById: { ...state.revisionsById, [runtimeId]: saved } }))
    } catch (cause) {
      set((state) => ({
        revisionsById: { ...state.revisionsById, [runtimeId]: previous },
      }))
      throw cause
    }
  },
  hydratePreview: (revisions) => set({
    revisionsById: index(revisions),
    status: 'ready',
    error: null,
  }),
  upsertLocal: (revision) => set((state) => ({
    revisionsById: { ...state.revisionsById, [revision.runtimeId]: revision },
  })),
  removeLocal: (runtimeId) => set((state) => {
    const revisionsById = { ...state.revisionsById }
    delete revisionsById[runtimeId]
    return { revisionsById }
  }),
  reset: () => set({ revisionsById: {}, status: 'idle', error: null }),
}))
