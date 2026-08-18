import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useNotificationStore } from '../store/notificationStore'
import type { RuleExecutionEvent } from '../types'
import { NotificationCenter } from './NotificationCenter'

const ruleEvent: RuleExecutionEvent = {
  version: '1.0',
  eventId: 'event-1',
  eventType: 'rule.action-group.executed',
  occurredAt: '2026-08-11T08:00:01Z',
  source: 'rule-engine',
  traceId: null,
  resource: { type: 'runtime', id: 'runtime-1', laboratoryId: null },
  data: {
    eventId: 'event-1',
    runtimeId: 'runtime-1',
    actionGroupId: 'group-1',
    deviceConditionGroupId: '高温条件',
    timeConditionGroupId: '工作时间',
    matchedAt: '2026-08-11T08:00:00Z',
    completedAt: '2026-08-11T08:00:01Z',
    traceId: null,
    actions: [{
      index: 0,
      type: 'Report',
      targetId: null,
      userIds: ['user-1'],
      reportTypes: ['SMS'],
      content: '实验室温度告警',
      status: 'NOT_IMPLEMENTED',
      message: 'not implemented',
      completedAt: '2026-08-11T08:00:01Z',
    }],
  },
}

describe('NotificationCenter', () => {
  beforeEach(() => {
    cleanup()
    useNotificationStore.getState().reset()
  })

  it('shows unread execution notices and marks them read', () => {
    useNotificationStore.getState().receive(ruleEvent)
    render(<NotificationCenter />)

    fireEvent.click(screen.getByRole('button', { name: '站内信，1 条未读' }))
    expect(screen.getByText('实验室温度告警')).toBeInTheDocument()
    fireEvent.click(screen.getByText('实验室温度告警'))
    expect(useNotificationStore.getState().messages[0].read).toBe(true)
  })
})
