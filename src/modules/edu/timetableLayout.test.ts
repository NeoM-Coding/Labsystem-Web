import { describe, expect, it } from 'vitest'
import type { Semester, Timetable } from './types'
import { layoutTimetables, sectionsForTime, timetableSectionLabel } from './timetableLayout'

const semester: Semester = {
  id: 'semester-1',
  name: '2026-2027 第1学期',
  startDate: '2026-09-01',
  endDate: '2027-01-16',
  createAt: '',
  updateAt: '',
}

const timetable = (id: string, startTime: string, endTime: string): Timetable => ({
  id,
  semesterId: semester.id,
  semester,
  laboratoryId: 'lab-1',
  laboratoryName: '智能实验室',
  courseName: `课程 ${id}`,
  teacherName: `教师 ${id}`,
  weekType: 'Both',
  startWeek: 1,
  endWeek: 16,
  ...sectionsForTime(startTime, endTime),
  startTime,
  endTime,
  weekday: 1,
})

describe('timetable layout', () => {
  it('maps backend time ranges to section rows', () => {
    expect(sectionsForTime('08:00:00', '09:40:00')).toEqual({
      startSection: 1,
      endSection: 2,
    })
    expect(timetableSectionLabel(timetable('a', '14:10:00', '17:40:00'))).toBe('5–8 节')
  })

  it('places visually overlapping week variants in parallel lanes', () => {
    const positioned = layoutTimetables([
      timetable('single', '08:00:00', '09:40:00'),
      timetable('double', '08:00:00', '09:40:00'),
      timetable('later', '10:00:00', '11:40:00'),
    ])

    const first = positioned.find((item) => item.timetable.id === 'single')
    const second = positioned.find((item) => item.timetable.id === 'double')
    const later = positioned.find((item) => item.timetable.id === 'later')
    expect(first?.laneCount).toBe(2)
    expect(second?.laneCount).toBe(2)
    expect(new Set([first?.lane, second?.lane])).toEqual(new Set([0, 1]))
    expect(later?.laneCount).toBe(1)
  })

  it('uses explicit sections for placement even when actual times differ', () => {
    const shifted = {
      ...timetable('shifted', '08:20:00', '09:20:00'),
      startSection: 3,
      endSection: 4,
    }

    expect(layoutTimetables([shifted])[0]).toMatchObject({
      startSection: 3,
      endSection: 4,
    })
    expect(timetableSectionLabel(shifted)).toBe('3–4 节')
  })
})
