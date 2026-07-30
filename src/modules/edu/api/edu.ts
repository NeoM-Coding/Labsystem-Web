import { apiRequest, http } from '@/shared/api/http'
import type {
  Semester,
  SemesterDraft,
  Timetable,
  TimetableDraft,
  TimetableImportResult,
} from '../types'

export const listSemesters = (keyword = '') => apiRequest<Semester[]>(
  () => http.get('/edu/semesters', { params: keyword ? { keyword } : undefined }),
  '加载学期失败',
)

export const createSemester = (draft: SemesterDraft) => apiRequest<Semester>(
  () => http.post('/edu/semesters', draft),
  '创建学期失败',
)

export const updateSemester = (semesterId: string, draft: SemesterDraft) => apiRequest<Semester>(
  () => http.put(`/edu/semesters/${semesterId}`, draft),
  '修改学期失败',
)

export async function deleteSemester(semesterId: string) {
  await apiRequest<null>(() => http.delete(`/edu/semesters/${semesterId}`), '删除学期失败')
}

export const listTimetables = (semesterId: string, laboratoryIds: string[]) => {
  const params = new URLSearchParams({ semesterId })
  laboratoryIds.forEach((id) => params.append('laboratoryIds', id))
  return apiRequest<Timetable[]>(
    () => http.get('/edu/timetables', { params }),
    '加载课表失败',
  )
}
export const createTimetable = (draft: TimetableDraft) => apiRequest<Timetable>(
  () => http.post('/edu/timetables', draft),
  '创建排课失败',
)

export const updateTimetable = (timetableId: string, draft: TimetableDraft) => apiRequest<Timetable>(
  () => http.put(`/edu/timetables/${timetableId}`, draft),
  '修改排课失败',
)

export async function deleteTimetable(timetableId: string) {
  await apiRequest<null>(() => http.delete(`/edu/timetables/${timetableId}`), '删除排课失败')
}

export async function clearTimetables(semesterId: string, laboratoryId: string) {
  await apiRequest<null>(
    () => http.delete('/edu/timetables', { params: { semesterId, laboratoryId } }),
    '清空实验室课表失败',
  )
}

export const importTimetables = (
  excel: File,
  semesterId: string,
  laboratoryId: string,
) => {
  const body = new FormData()
  body.append('excel', excel)
  return apiRequest<TimetableImportResult>(
    () => http.post('/edu/timetables/import', body, {
      params: { semesterId, laboratoryId },
      timeout: 30_000,
    }),
    '导入课表失败',
  )
}
