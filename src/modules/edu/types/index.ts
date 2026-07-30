export type WeekType = 'Single' | 'Double' | 'Both'

export interface Semester {
  id: string
  name: string
  startDate: string
  endDate: string
  createAt: string
  updateAt: string
}

export interface SemesterDraft {
  name: string
  startDate: string
  endDate: string
}

export interface Timetable {
  id: string
  semesterId: string
  semester: Semester
  laboratoryId: string
  laboratoryName: string | null
  courseName: string
  teacherName: string
  weekType: WeekType
  startWeek: number
  endWeek: number
  startSection: number
  endSection: number
  startTime: string
  endTime: string
  weekday: number
}

export interface TimetableDraft {
  semesterId: string
  laboratoryId: string
  courseName: string
  teacherName: string
  weekType: WeekType
  startWeek: number
  endWeek: number
  startSection: number
  endSection: number
  startTime: string
  endTime: string
  weekday: number
}

export interface TimetableImportError {
  rowIndex: number
  columnIndex: number
  rawContent: string
  reason: string
}

export interface TimetableImportResult {
  ok: number
  fail: number
  errors: TimetableImportError[]
}
