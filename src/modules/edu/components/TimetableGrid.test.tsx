import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Semester, Timetable } from '../types'
import { TimetableGrid } from './TimetableGrid'
import type { Laboratory } from '@/modules/laboratory/types'

const semester: Semester = {
  id: 'semester-1',
  name: '2026-2027 第1学期',
  startDate: '2026-09-01',
  endDate: '2027-01-16',
  createAt: '',
  updateAt: '',
}

const course: Timetable = {
  id: 'course-1',
  semesterId: semester.id,
  semester,
  laboratoryId: 'lab-1',
  laboratoryName: '智能实验室',
  courseName: '操作系统',
  teacherName: '张老师',
  weekType: 'Single',
  startWeek: 1,
  endWeek: 16,
  startSection: 1,
  endSection: 2,
  startTime: '08:00:00',
  endTime: '09:40:00',
  weekday: 1,
}

const laboratory: Laboratory = {
  id: 'lab-1',
  laboratoryName: '智能实验室',
  buildingName: '创新楼',
  orgName: '计算机学院',
  extra: null,
  managers: [],
  createAt: '',
  updateAt: '',
}

describe('TimetableGrid', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('opens a course on a short press', () => {
    const onOpen = vi.fn()
    render(<TimetableGrid timetables={[course]} laboratories={[laboratory]} onOpen={onOpen} onDelete={vi.fn()} />)
    const block = screen.getByRole('button', { name: /操作系统，智能实验室，星期一，1–2 节/ })

    fireEvent.pointerDown(block, { button: 0, pointerId: 1, clientX: 20, clientY: 20 })
    fireEvent.pointerUp(block, { button: 0, pointerId: 1, clientX: 20, clientY: 20 })

    expect(onOpen).toHaveBeenCalledWith(course)
  })

  it('shows delete controls for every course after a long press', () => {
    vi.useFakeTimers()
    render(<TimetableGrid timetables={[course]} laboratories={[laboratory]} onOpen={vi.fn()} onDelete={vi.fn()} />)
    const block = screen.getByRole('button', { name: /操作系统，智能实验室，星期一，1–2 节/ })

    fireEvent.pointerDown(block, { button: 0, pointerId: 1, clientX: 20, clientY: 20 })
    act(() => vi.advanceTimersByTime(520))

    expect(screen.getByRole('button', { name: '删除 操作系统' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '完成' })).toBeInTheDocument()
  })

  it('keeps the timetable empty until a laboratory is selected', () => {
    render(<TimetableGrid timetables={[]} laboratories={[]} onOpen={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText('请先选择实验室')).toBeInTheDocument()
    expect(screen.queryByText('星期一')).not.toBeInTheDocument()
  })
})
