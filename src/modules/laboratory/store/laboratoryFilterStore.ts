import { create } from 'zustand'
import type { Laboratory } from '../types'

interface LaboratoryFilterState {
  buildingNames: string[]
  orgNames: string[]
  matchedLaboratories: Laboratory[]
  laboratoryIds: string[]
  isResolving: boolean
  setBuildingNames: (buildingNames: string[]) => void
  setOrgNames: (orgNames: string[]) => void
  setLaboratoryIds: (laboratoryIds: string[]) => void
  setResolution: (
    laboratories: Laboratory[],
    isResolving: boolean,
    selectAll?: boolean,
  ) => void
  toggleLaboratory: (laboratoryId: string) => void
  selectAllLaboratories: () => void
  clearLaboratorySelection: () => void
  clearFilters: () => void
}

export const useLaboratoryFilterStore = create<LaboratoryFilterState>((set) => ({
  buildingNames: [],
  orgNames: [],
  matchedLaboratories: [],
  laboratoryIds: [],
  isResolving: true,
  setBuildingNames: (buildingNames) => set({ buildingNames }),
  setOrgNames: (orgNames) => set({ orgNames }),
  setLaboratoryIds: (laboratoryIds) => set((state) => {
    const availableIds = new Set(state.matchedLaboratories.map((laboratory) => laboratory.id))
    return {
      laboratoryIds: [...new Set(laboratoryIds)].filter((id) => availableIds.has(id)),
    }
  }),
  setResolution: (laboratories, isResolving, selectAll = true) => {
    if (isResolving) {
      set({ isResolving: true })
      return
    }
    set({
      matchedLaboratories: laboratories,
      laboratoryIds: selectAll ? laboratories.map((laboratory) => laboratory.id) : [],
      isResolving: false,
    })
  },
  toggleLaboratory: (laboratoryId) => set((state) => ({
    laboratoryIds: state.laboratoryIds.includes(laboratoryId)
      ? state.laboratoryIds.filter((id) => id !== laboratoryId)
      : [...state.laboratoryIds, laboratoryId],
  })),
  selectAllLaboratories: () => set((state) => ({
    laboratoryIds: state.matchedLaboratories.map((laboratory) => laboratory.id),
  })),
  clearLaboratorySelection: () => set({ laboratoryIds: [] }),
  clearFilters: () => set((state) => ({
    buildingNames: [],
    orgNames: [],
    laboratoryIds: state.matchedLaboratories.map((laboratory) => laboratory.id),
  })),
}))
