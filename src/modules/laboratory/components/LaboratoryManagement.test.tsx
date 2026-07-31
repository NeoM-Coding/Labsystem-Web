import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
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
    cleanup()
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

  it('uses the same extra field configuration for the editor and table', async () => {
    useLaboratoryStore.getState().hydratePreview([])

    render(
      <LaboratoryManagement
        preview
        extraColumns={[
          {
            key: 'capacity',
            label: '容纳人数',
            render: (value) => typeof value === 'number' ? `${value} 人` : '—',
            input: { type: 'number', unit: '人', min: 1 },
          },
          {
            key: 'facilities.workstationCount',
            label: '工位数量',
            input: { type: 'number', unit: '个', min: 0 },
          },
        ]}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '新增实验室' }))

    expect(screen.queryByText(/JSON/)).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('实验室名称'), { target: { value: '软件实验室' } })
    fireEvent.change(screen.getByLabelText('楼栋名称'), { target: { value: '创新楼' } })
    fireEvent.change(screen.getByLabelText('容纳人数'), { target: { value: '40' } })
    fireEvent.change(screen.getByLabelText('工位数量'), { target: { value: '36' } })
    fireEvent.click(screen.getByRole('button', { name: '保存' }))

    await waitFor(() => expect(screen.queryByRole('dialog', { name: '新增实验室' })).not.toBeInTheDocument())
    const created = Object.values(useLaboratoryStore.getState().laboratoriesById)[0]
    expect(created.extra).toEqual({
      capacity: 40,
      facilities: { workstationCount: 36 },
    })
    expect(screen.getByText('40 人')).toBeInTheDocument()
    expect(screen.getByText('36')).toBeInTheDocument()
  })

  it('loads and filters users and contacts when selecting laboratory managers', async () => {
    useLaboratoryStore.getState().hydratePreview([])
    const listMembers = vi.fn().mockResolvedValue([
      {
        id: 'user-1',
        name: '张老师',
        username: 'zhang',
        email: 'zhang@example.edu.cn',
      },
      {
        id: 'contact-1',
        name: '李老师',
        phone: '13800000000',
      },
    ])

    render(<LaboratoryManagement preview listMembers={listMembers} />)
    fireEvent.click(screen.getByRole('button', { name: '新增实验室' }))
    fireEvent.click(screen.getByRole('button', { name: '选择成员' }))

    await waitFor(() => expect(listMembers).toHaveBeenCalledWith(undefined))
    expect(await screen.findByRole('button', { name: '选择成员 张老师' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '选择成员 李老师' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('搜索负责人'), { target: { value: '李' } })
    await waitFor(() => expect(listMembers).toHaveBeenCalledWith('李'))
    fireEvent.click(screen.getByRole('button', { name: '选择成员 李老师' }))

    expect(screen.getAllByText('联系人')).toHaveLength(2)
    expect(screen.getByRole('button', { name: '移除负责人 李老师' })).toBeInTheDocument()
  })
})
