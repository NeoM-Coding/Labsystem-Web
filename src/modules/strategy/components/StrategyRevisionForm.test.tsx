import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Device } from '@/modules/device/types'
import type { RuntimeRevision } from '../types'
import { StrategyRevisionForm } from './StrategyRevisionForm'

const devices: Device[] = [{
  id: 'air-1',
  deviceName: '中央空调',
  belongTo: 'lab-1',
  deviceType: 'AirCondition',
  polling: true,
  gatewayId: 'gateway-1',
  address: 31,
  selfId: 2,
}]

const revision: RuntimeRevision = {
  runtimeId: 'rule-1',
  enabled: false,
  activeFrom: null,
  activeUntil: null,
  deviceConditionGroups: [{
    groupId: '高温条件',
    conditions: [{
      conditionId: 'condition-1',
      deviceType: 'AirCondition',
      deviceId: 'air-1',
      field: 'mode',
      operator: 'EQ',
      value: 'Heating',
      logicToPrevious: 'AND',
    }],
  }],
  timeConditionGroups: [{ groupId: '始终满足', conditions: [] }],
  actionGroups: [{
    actionGroupId: '打开空调',
    deviceConditionGroupId: '高温条件',
    timeConditionGroupId: '始终满足',
    actions: [{
      type: 'Control',
      control: {
        commandLine: 'OPEN_AIR_CONDITION_RS485',
        args: [],
        type: 'AirCondition',
        deviceId: 'air-1',
      },
      userIds: [],
      reportTypes: [],
      content: null,
    }],
  }],
}

describe('StrategyRevisionForm', () => {
  beforeEach(cleanup)
  it('edits readable fields and cascades renamed group references', async () => {
    const onChange = vi.fn()
    render(
      <StrategyRevisionForm
        initialValue={revision}
        mode="edit"
        devices={devices}
        onChange={onChange}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.queryByText('策略 JSON')).not.toBeInTheDocument()
    const groupName = screen.getByLabelText('条件组名称')
    fireEvent.change(groupName, { target: { value: '制热状态' } })

    expect(screen.getByLabelText('设备条件组')).toHaveValue('制热状态')
    expect(screen.getAllByRole('button', { name: '删除组' })[0]).toBeDisabled()
    await waitFor(() => {
      const latest = onChange.mock.calls.at(-1)?.[0] as RuntimeRevision
      expect(latest.actionGroups[0].deviceConditionGroupId).toBe('制热状态')
      expect(latest.deviceConditionGroups[0].conditions[0].value).toBe('Heating')
    })
  })

  it('retains referenced devices outside the current laboratory filter', () => {
    render(
      <StrategyRevisionForm
        initialValue={revision}
        mode="edit"
        devices={[]}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )
    expect(screen.getAllByRole('option', { name: '当前筛选外 · air-1' }).length).toBeGreaterThan(0)
  })

  it('creates and edits report actions with searchable members', async () => {
    const onChange = vi.fn()
    const listMembers = vi.fn().mockResolvedValue([
      { id: 'user-1', name: '张老师', username: 'zhang', email: 'zhang@example.com' },
      { id: 'contact-1', name: '李老师', email: 'li@example.com' },
    ])
    render(
      <StrategyRevisionForm
        mode="create"
        devices={devices}
        listMembers={listMembers}
        onChange={onChange}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '＋ 添加通知动作' }))
    fireEvent.change(screen.getByLabelText('通知内容'), { target: { value: '温度告警' } })
    fireEvent.click(screen.getByRole('button', { name: '选择成员' }))
    await waitFor(() => expect(listMembers).toHaveBeenCalled())
    fireEvent.click(await screen.findByRole('button', { name: '选择成员 张老师' }))
    fireEvent.click(screen.getByRole('button', { name: '短信 · 尚未实现' }))

    await waitFor(() => {
      const latest = onChange.mock.calls.at(-1)?.[0] as RuntimeRevision
      expect(latest.actionGroups[0].actions[0]).toMatchObject({
        type: 'Report',
        userIds: ['user-1'],
        reportTypes: ['SMS'],
        content: '温度告警',
      })
    })
  })
})
