import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Laboratory } from '@/modules/laboratory/types'
import type { Semester } from '../types'
import { TimetableEditor } from './TimetableEditor'

const semester: Semester = {
  id: 'semester-1',
  name: '2026-2027 第1学期',
  startDate: '2026-09-01',
  endDate: '2027-01-16',
  createAt: '',
  updateAt: '',
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

describe('TimetableEditor', () => {
  afterEach(cleanup)

  it('defaults times from sections but preserves an independently adjusted time', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(
      <TimetableEditor
        timetable={null}
        semesters={[semester]}
        laboratories={[laboratory]}
        defaultSemesterId={semester.id}
        defaultLaboratoryId={laboratory.id}
        saving={false}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText('开始节次'), { target: { value: '3' } })
    expect(screen.getByLabelText('上课时间')).toHaveValue('10:00')
    expect(screen.getByLabelText('下课时间')).toHaveValue('10:45')

    fireEvent.change(screen.getByLabelText('上课时间'), { target: { value: '10:10' } })
    expect(screen.getByText('已单独调整时间，不会改变课程在课表中的节次位置。')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('开始节次'), { target: { value: '2' } })
    expect(screen.getByLabelText('上课时间')).toHaveValue('10:10')

    fireEvent.change(screen.getByLabelText('开始节次'), { target: { value: '3' } })
    fireEvent.change(screen.getByLabelText('结束节次'), { target: { value: '4' } })
    expect(screen.getByLabelText('上课时间')).toHaveValue('10:10')
    expect(screen.getByLabelText('下课时间')).toHaveValue('11:40')

    fireEvent.change(screen.getByLabelText('课程名称'), { target: { value: '操作系统' } })
    fireEvent.change(screen.getByLabelText('教师姓名'), { target: { value: '张老师' } })
    fireEvent.click(screen.getByRole('button', { name: '创建排课' }))

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      startSection: 3,
      endSection: 4,
      startTime: '10:10',
      endTime: '11:40',
    })))
  })
})
