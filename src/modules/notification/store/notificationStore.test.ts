import { beforeEach, describe, expect, it } from 'vitest'
import { useNotificationStore } from './notificationStore'
import type { RuleExecutionEvent } from '../types'

function event(index: number): RuleExecutionEvent {
  const eventId = `event-${index}`
  return {
    version: '1.0',
    eventId,
    eventType: 'rule.action-group.executed',
    occurredAt: '2026-08-11T08:00:00Z',
    source: 'rule-engine',
    traceId: null,
    resource: { type: 'runtime', id: 'runtime-1', laboratoryId: null },
    data: {
      eventId,
      runtimeId: 'runtime-1',
      actionGroupId: 'group-1',
      deviceConditionGroupId: 'device-group',
      timeConditionGroupId: 'time-group',
      matchedAt: '2026-08-11T08:00:00Z',
      completedAt: '2026-08-11T08:00:01Z',
      traceId: null,
      actions: [],
    },
  }
}

describe('notificationStore', () => {
  beforeEach(() => useNotificationStore.getState().reset())

  it('deduplicates messages and keeps newest first', () => {
    useNotificationStore.getState().receive(event(1))
    useNotificationStore.getState().receive(event(2))
    useNotificationStore.getState().receive(event(1))
    expect(useNotificationStore.getState().messages.map((item) => item.event.eventId))
      .toEqual(['event-2', 'event-1'])
  })

  it('tracks read state and limits memory history', () => {
    for (let index = 0; index < 105; index += 1) {
      useNotificationStore.getState().receive(event(index))
    }
    expect(useNotificationStore.getState().messages).toHaveLength(100)
    useNotificationStore.getState().markRead('event-104')
    expect(useNotificationStore.getState().messages[0].read).toBe(true)
    useNotificationStore.getState().markAllRead()
    expect(useNotificationStore.getState().messages.every((item) => item.read)).toBe(true)
    useNotificationStore.getState().clear()
    expect(useNotificationStore.getState().messages).toEqual([])
  })
})
