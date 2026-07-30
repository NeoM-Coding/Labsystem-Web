import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useLaboratoryStore } from '../store/laboratoryStore'
import type { Laboratory } from '../types'
import { LaboratoryManagement } from './LaboratoryManagement'

const laboratory: Laboratory = {
  id: 'lab-201',
  buildingName: '创新楼',
  orgName: '计算机学院',
  laboratoryName: '智能实验室',
  extra: {
    capacity: 40,
    facilities: { workstationCount: 36 },
  },
  managers: [{
    id: 'user-1',
    name: '张老师',
    username: 'zhang',
    phone: '13800000000',
    email: 'zhang@example.edu.cn',
  }],
  createAt: '2026-07-01T08:00:00Z',
  updateAt: '2026-07-24T08:00:00Z',
}

describe('LaboratoryManagement', () => {
  afterEach(() => {
    useLaboratoryStore.getState().reset()
  })

  it('renders configured extra columns and opens manager details', () => {
    useLaboratoryStore.getState().hydratePreview([laboratory])

    render(
      <LaboratoryManagement
        preview
        extraColumns={[
          { key: 'capacity', label: '容纳人数', render: (value) => `${String(value)} 人` },
          { key: 'facilities.workstationCount', label: '工位数量' },
        ]}
      />,
    )

    expect(screen.getByRole('columnheader', { name: '容纳人数' })).toBeInTheDocument()
    expect(screen.getByText('40 人')).toBeInTheDocument()
    expect(screen.getByText('36')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '张老师' }))

    expect(screen.getByRole('dialog', { name: '张老师的负责人详情' })).toBeInTheDocument()
    expect(screen.getByText('13800000000')).toBeInTheDocument()
    expect(screen.getByText('zhang@example.edu.cn')).toBeInTheDocument()
  })
})
