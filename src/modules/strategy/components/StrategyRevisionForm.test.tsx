import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
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
})
