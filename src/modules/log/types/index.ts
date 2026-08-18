import type { ManagedUser } from '@/modules/account/types'
import type { RuntimeRevision } from '@/modules/strategy/types'

export interface PageResult<T> {
  records: T[]
  total: number
  current: number
  size: number
  pages: number
}

export interface AuditLog {
  id: string
  subjectId: string | null
  subjectName: string | null
  subjectDisplayName: string | null
  operation: string | null
  actions: string | null
  objectTypes: string | null
  objectIds: string | null
  eventTypes: string | null
  description: string | null
  traceId: string | null
  requestId: string | null
  occurredAt: string
}

export interface AuditLogQuery {
  current: number
  size: number
  subjectName?: string
  subjectDisplayName?: string
  operation?: string
  action?: string
  objectType?: string
  objectId?: string
  description?: string
  traceId?: string
  occurredFrom?: string
  occurredTo?: string
}

export interface AlertActionResult {
  index: number
  type: string
  targetId: string | null
  userIds: string[]
  reportTypes: string[]
  content: string | null
  status: string
  message: string | null
  completedAt: string | null
}

export interface RuleAlertLog {
  id: string
  eventId: string
  runtimeId: string
  actionGroupId: string
  deviceConditionGroupId: string | null
  timeConditionGroupId: string | null
  matchedAt: string
  completedAt: string | null
  status: string
  content: string | null
  userIds: string[]
  actions: AlertActionResult[]
  createAt: string
}

export interface AlertLogQuery {
  current: number
  size: number
  runtimeId?: string
  actionGroupId?: string
  status?: string
  matchedFrom?: string
  matchedTo?: string
}

export type AuditLogLoader = (query: AuditLogQuery) => Promise<PageResult<AuditLog>>
export type AlertLogLoader = (query: AlertLogQuery) => Promise<PageResult<RuleAlertLog>>
export type UserLoader = (keyword?: string) => Promise<ManagedUser[]>
export type StrategyLoader = (runtimeId: string) => Promise<RuntimeRevision>
