import type { Timetable, WeekType } from './types'

export interface SectionSlot {
  section: number
  start: string
  end: string
}

export const SECTION_SLOTS: SectionSlot[] = [
  { section: 1, start: '08:00', end: '08:45' },
  { section: 2, start: '08:55', end: '09:40' },
  { section: 3, start: '10:00', end: '10:45' },
  { section: 4, start: '10:55', end: '11:40' },
  { section: 5, start: '14:10', end: '14:55' },
  { section: 6, start: '15:05', end: '15:50' },
  { section: 7, start: '16:00', end: '16:45' },
  { section: 8, start: '16:55', end: '17:40' },
  { section: 9, start: '18:40', end: '19:25' },
  { section: 10, start: '19:30', end: '20:15' },
  { section: 11, start: '20:20', end: '21:05' },
]

export const WEEKDAYS = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日']

export const WEEK_TYPE_LABELS: Record<WeekType, string> = {
  Single: '单周',
  Double: '双周',
  Both: '每周',
}

const minuteOf = (value: string) => {
  const [hour = 0, minute = 0] = value.slice(0, 5).split(':').map(Number)
  return hour * 60 + minute
}

export function sectionsForTime(startTime: string, endTime: string) {
  const startMinute = minuteOf(startTime)
  const endMinute = minuteOf(endTime)
  const firstMatch = SECTION_SLOTS.findIndex((slot) => minuteOf(slot.end) > startMinute)
  const first = firstMatch < 0 ? SECTION_SLOTS.length - 1 : firstMatch
  let last = -1
  SECTION_SLOTS.forEach((slot, index) => {
    if (minuteOf(slot.start) < endMinute) last = index
  })
  last = Math.max(first, last)
  return { startSection: first + 1, endSection: last + 1 }
}

export interface PositionedTimetable {
  timetable: Timetable
  startSection: number
  endSection: number
  lane: number
  laneCount: number
}

interface Candidate {
  timetable: Timetable
  startSection: number
  endSection: number
}

function assignComponentLanes(component: Candidate[]): PositionedTimetable[] {
  const laneEnds: number[] = []
  const assigned = component.map((candidate) => {
    let lane = laneEnds.findIndex((endSection) => endSection < candidate.startSection)
    if (lane < 0) {
      lane = laneEnds.length
      laneEnds.push(candidate.endSection)
    } else {
      laneEnds[lane] = candidate.endSection
    }
    return { ...candidate, lane }
  })
  const laneCount = Math.max(1, laneEnds.length)
  return assigned.map((candidate) => ({ ...candidate, laneCount }))
}

export function layoutTimetables(timetables: Timetable[]): PositionedTimetable[] {
  const byWeekday = new Map<number, Candidate[]>()
  timetables.forEach((timetable) => {
    const inferred = sectionsForTime(timetable.startTime, timetable.endTime)
    const sections = {
      startSection: timetable.startSection ?? inferred.startSection,
      endSection: timetable.endSection ?? inferred.endSection,
    }
    const candidates = byWeekday.get(timetable.weekday) ?? []
    candidates.push({ timetable, ...sections })
    byWeekday.set(timetable.weekday, candidates)
  })

  const positioned: PositionedTimetable[] = []
  byWeekday.forEach((candidates) => {
    const sorted = [...candidates].sort((left, right) =>
      left.startSection - right.startSection
      || left.endSection - right.endSection
      || left.timetable.id.localeCompare(right.timetable.id),
    )
    let component: Candidate[] = []
    let componentEnd = -1
    const flush = () => {
      positioned.push(...assignComponentLanes(component))
      component = []
      componentEnd = -1
    }
    sorted.forEach((candidate) => {
      if (component.length && candidate.startSection > componentEnd) flush()
      component.push(candidate)
      componentEnd = Math.max(componentEnd, candidate.endSection)
    })
    if (component.length) flush()
  })
  return positioned
}

export function timetableSectionLabel(
  timetable: Pick<Timetable, 'startSection' | 'endSection' | 'startTime' | 'endTime'>,
) {
  const inferred = sectionsForTime(timetable.startTime, timetable.endTime)
  const startSection = timetable.startSection ?? inferred.startSection
  const endSection = timetable.endSection ?? inferred.endSection
  return startSection === endSection ? `第 ${startSection} 节` : `${startSection}–${endSection} 节`
}
