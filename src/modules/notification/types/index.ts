import type { RealtimeEvent } from '@/modules/device/types'

export type RuleActionStatus = 'SUCCESS' | 'FAILED' | 'NOT_IMPLEMENTED'

export interface RuleActionResult {
  index: number
  type: 'Control' | 'Report'
  targetId: string | null
  userIds: string[]
  reportTypes: string[]
  content: string | null
  status: RuleActionStatus
  message: string
  completedAt: string | number | null
}

export interface RuleExecutionNoticeData {
  eventId: string
  runtimeId: string
  actionGroupId: string
  deviceConditionGroupId: string
  timeConditionGroupId: string
  matchedAt: string | number
  completedAt: string | number
  traceId: string | null
  actions: RuleActionResult[]
}

export interface RuleExecutionEvent extends RealtimeEvent {
  eventType: 'rule.action-group.executed'
  data: RuleExecutionNoticeData & Record<string, unknown>
}

export interface InboxMessage {
  event: RuleExecutionEvent
  read: boolean
}
