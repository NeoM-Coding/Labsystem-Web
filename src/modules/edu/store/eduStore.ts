import { create } from 'zustand'
import {
  createSemester,
  createTimetable,
  deleteSemester,
  deleteTimetable,
  listSemesters,
  listTimetables,
  updateSemester,
  updateTimetable,
} from '../api/edu'
import type { Semester, SemesterDraft, Timetable, TimetableDraft } from '../types'

interface EduState {
  semesters: Semester[]
  timetablesById: Record<string, Timetable>
  semesterStatus: 'idle' | 'loading' | 'ready' | 'error'
  timetableStatus: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  loadSemesters: () => Promise<Semester[]>
  loadTimetables: (semesterId: string, laboratoryIds: string[]) => Promise<void>
  createSemester: (draft: SemesterDraft) => Promise<Semester>
  updateSemester: (semesterId: string, draft: SemesterDraft) => Promise<Semester>
  deleteSemester: (semesterId: string) => Promise<void>
  createTimetable: (draft: TimetableDraft) => Promise<Timetable>
  updateTimetable: (timetableId: string, draft: TimetableDraft) => Promise<Timetable>
  deleteTimetable: (timetableId: string) => Promise<void>
  upsertSemesterLocal: (semester: Semester) => void
  removeSemesterLocal: (semesterId: string) => void
  upsertTimetableLocal: (timetable: Timetable) => void
  removeTimetableLocal: (timetableId: string) => void
  clearTimetableView: () => void
  hydratePreview: (semesters: Semester[], timetables: Timetable[]) => void
  reset: () => void
}

const indexTimetables = (items: Timetable[]) =>
  Object.fromEntries(items.map((item) => [item.id, item]))

export const useEduStore = create<EduState>((set) => ({
  semesters: [],
  timetablesById: {},
  semesterStatus: 'idle',
  timetableStatus: 'idle',
  error: null,
  loadSemesters: async () => {
    set({ semesterStatus: 'loading', error: null })
    try {
      const semesters = await listSemesters()
      set({ semesters, semesterStatus: 'ready' })
      return semesters
    } catch (cause) {
      set({
        semesterStatus: 'error',
        error: cause instanceof Error ? cause.message : '加载学期失败',
      })
      throw cause
    }
  },
  loadTimetables: async (semesterId, laboratoryIds) => {
    set({ timetableStatus: 'loading', error: null })
    try {
      const timetables = await listTimetables(semesterId, laboratoryIds)
      set({ timetablesById: indexTimetables(timetables), timetableStatus: 'ready' })
    } catch (cause) {
      set({
        timetableStatus: 'error',
        error: cause instanceof Error ? cause.message : '加载课表失败',
      })
      throw cause
    }
  },
  createSemester: async (draft) => {
    const semester = await createSemester(draft)
    set((state) => ({ semesters: [semester, ...state.semesters] }))
    return semester
  },
  updateSemester: async (semesterId, draft) => {
    const semester = await updateSemester(semesterId, draft)
    set((state) => ({
      semesters: state.semesters.map((item) => item.id === semesterId ? semester : item),
    }))
    return semester
  },
  deleteSemester: async (semesterId) => {
    await deleteSemester(semesterId)
    set((state) => ({ semesters: state.semesters.filter((item) => item.id !== semesterId) }))
  },
  createTimetable: async (draft) => {
    const timetable = await createTimetable(draft)
    set((state) => ({
      timetablesById: { ...state.timetablesById, [timetable.id]: timetable },
    }))
    return timetable
  },
  updateTimetable: async (timetableId, draft) => {
    const timetable = await updateTimetable(timetableId, draft)
    set((state) => ({
      timetablesById: { ...state.timetablesById, [timetableId]: timetable },
    }))
    return timetable
  },
  deleteTimetable: async (timetableId) => {
    await deleteTimetable(timetableId)
    set((state) => {
      const timetablesById = { ...state.timetablesById }
      delete timetablesById[timetableId]
      return { timetablesById }
    })
  },
  upsertSemesterLocal: (semester) => set((state) => ({
    semesters: [
      semester,
      ...state.semesters.filter((item) => item.id !== semester.id),
    ],
  })),
  removeSemesterLocal: (semesterId) => set((state) => ({
    semesters: state.semesters.filter((item) => item.id !== semesterId),
  })),
  upsertTimetableLocal: (timetable) => set((state) => ({
    timetablesById: { ...state.timetablesById, [timetable.id]: timetable },
  })),
  removeTimetableLocal: (timetableId) => set((state) => {
    const timetablesById = { ...state.timetablesById }
    delete timetablesById[timetableId]
    return { timetablesById }
  }),
  clearTimetableView: () => set({
    timetablesById: {},
    timetableStatus: 'ready',
    error: null,
  }),
  hydratePreview: (semesters, timetables) => set({
    semesters,
    timetablesById: indexTimetables(timetables),
    semesterStatus: 'ready',
    timetableStatus: 'ready',
    error: null,
  }),
  reset: () => set({
    semesters: [],
    timetablesById: {},
    semesterStatus: 'idle',
    timetableStatus: 'idle',
    error: null,
  }),
}))
