import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AlertLogExplorer } from './AlertLogExplorer'
import { AuditLogExplorer } from './AuditLogExplorer'

afterEach(cleanup)

describe('log explorers', () => {
  it('queries audit logs and opens operator details', async () => {
    const loadLogs = vi.fn().mockResolvedValue({
      records: [{
        id: 'audit-1', subjectId: 'user-1', subjectName: 'admin', subjectDisplayName: '张管理员',
        operation: 'SemesterService#create', actions: 'manage_semester', objectTypes: 'semester',
        objectIds: 'semester-1', eventTypes: 'CREATE', description: '创建学期', traceId: 'trace-1',
        requestId: 'request-1', occurredAt: '2026-08-12T09:30:00',
      }],
      total: 1, current: 1, size: 20, pages: 1,
    })
    render(<AuditLogExplorer loadLogs={loadLogs} />)

    expect(await screen.findByRole('button', { name: '张管理员' })).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('模糊匹配显示名称'), { target: { value: '张' } })
    fireEvent.click(screen.getByRole('button', { name: '查询日志' }))
    await waitFor(() => expect(loadLogs).toHaveBeenLastCalledWith(expect.objectContaining({ subjectDisplayName: '张' })))
    fireEvent.click(screen.getByRole('button', { name: '张管理员' }))
    const dialog = screen.getByRole('dialog', { name: '张管理员' })
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByText('trace-1')).toBeInTheDocument()
  })

  it('opens alert actions and loads linked strategy', async () => {
    const loadLogs = vi.fn().mockResolvedValue({
      records: [{
        id: 'alert-1', eventId: 'event-1', runtimeId: 'strategy-1', actionGroupId: 'group-1',
        deviceConditionGroupId: 'device-group', timeConditionGroupId: 'time-group',
        matchedAt: '2026-08-12T01:20:00Z', completedAt: '2026-08-12T01:20:01Z',
        status: 'FAILED', content: '控制失败', userIds: ['user-1'], createAt: '2026-08-12T09:20:01',
        actions: [{ index: 0, type: 'Control', targetId: 'device-1', userIds: [], reportTypes: [], content: null, status: 'FAILED', message: '设备离线', completedAt: '2026-08-12T01:20:01Z' }],
      }],
      total: 1, current: 1, size: 20, pages: 1,
    })
    const loadStrategy = vi.fn().mockResolvedValue({
      runtimeId: 'strategy-1', enabled: true, activeFrom: null, activeUntil: null,
      deviceConditionGroups: [], timeConditionGroups: [], actionGroups: [],
    })
    render(<AlertLogExplorer loadLogs={loadLogs} loadStrategy={loadStrategy} loadUsers={vi.fn().mockResolvedValue([])} />)

    fireEvent.click(await screen.findByRole('button', { name: '1 个动作' }))
    expect(screen.getByRole('dialog', { name: '动作组 group-1' })).toBeInTheDocument()
    expect(screen.getByText('设备离线')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'strategy-1' })[1])
    await waitFor(() => expect(loadStrategy).toHaveBeenCalledWith('strategy-1'))
    expect(await screen.findByText('已启用')).toBeInTheDocument()
  })
})
