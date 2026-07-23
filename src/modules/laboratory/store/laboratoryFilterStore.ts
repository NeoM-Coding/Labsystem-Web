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
  setResolution: (laboratories: Laboratory[], isResolving: boolean) => void
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
  setResolution: (laboratories, isResolving) => {
    if (isResolving) {
      set({ isResolving: true })
      return
    }
    set({
      matchedLaboratories: laboratories,
      laboratoryIds: laboratories.map((laboratory) => laboratory.id),
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
  clearFilters: () => set({ buildingNames: [], orgNames: [] }),
}))
