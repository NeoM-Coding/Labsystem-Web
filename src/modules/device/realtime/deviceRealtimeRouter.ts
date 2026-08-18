import type { RealtimeEvent } from '../types'
import type { RuleExecutionEvent } from '@/modules/notification/types'

export const realtimeEventTypes = {
  systemConnected: 'system.connected',
  telemetryUpdated: 'device.telemetry.updated',
  onlineChanged: 'device.online.changed',
  alertRaised: 'device.alert.raised',
  alertResolved: 'device.alert.resolved',
  ruleActionGroupExecuted: 'rule.action-group.executed',
} as const

const deviceEventTypes = new Set<string>([
  realtimeEventTypes.telemetryUpdated,
  realtimeEventTypes.onlineChanged,
  realtimeEventTypes.alertRaised,
  realtimeEventTypes.alertResolved,
])

export type RealtimeRouteResult =
  | 'system.connected'
  | 'device.event'
  | 'rule.action-group.executed'
  | 'unsupported-version'
  | 'unknown-event'
  | 'invalid-message'

interface RealtimeRoutes {
  onConnected: (event: RealtimeEvent) => void
  onDeviceEvent: (event: RealtimeEvent) => void
  onRuleExecution?: (event: RuleExecutionEvent) => void
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeOccurredAt(value: unknown): string | null {
  if (typeof value === 'string') {
    return Number.isFinite(Date.parse(value)) ? value : null
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) return null

  // Jackson's JavaTimeModule serializes Instant as epoch seconds with a decimal
  // fraction by default. Also accept epoch milliseconds for compatibility.
  const milliseconds = Math.abs(value) < 1e12 ? value * 1_000 : value
  const date = new Date(milliseconds)
  return Number.isFinite(date.getTime()) ? date.toISOString() : null
}

function isInstantValue(value: unknown) {
  return typeof value === 'string'
    ? Number.isFinite(Date.parse(value))
    : typeof value === 'number' && Number.isFinite(value)
}

export function parseRealtimeEvent(payload: unknown): RealtimeEvent | null {
  let candidate: unknown = payload
  if (typeof payload === 'string') {
    try {
      candidate = JSON.parse(payload)
    } catch {
      return null
    }
  }
  if (!isObject(candidate) || !isObject(candidate.resource) || !isObject(candidate.data)) {
    return null
  }

  const resource = candidate.resource
  const occurredAt = normalizeOccurredAt(candidate.occurredAt)
  if (
    typeof candidate.version !== 'string'
    || typeof candidate.eventId !== 'string'
    || candidate.eventId.length === 0
    || typeof candidate.eventType !== 'string'
    || occurredAt === null
    || typeof candidate.source !== 'string'
    || (candidate.traceId !== null && typeof candidate.traceId !== 'string')
    || typeof resource.type !== 'string'
    || typeof resource.id !== 'string'
    || resource.id.length === 0
    || (resource.laboratoryId !== null && typeof resource.laboratoryId !== 'string')
  ) {
    return null
  }

  return {
    ...candidate,
    occurredAt,
  } as unknown as RealtimeEvent
}

export function routeRealtimeMessage(
  payload: unknown,
  routes: RealtimeRoutes,
): RealtimeRouteResult {
  const event = parseRealtimeEvent(payload)
  if (!event) return 'invalid-message'
  if (event.version !== '1.0') return 'unsupported-version'

  if (event.eventType === realtimeEventTypes.systemConnected) {
    if (event.resource.type !== 'user') return 'invalid-message'
    routes.onConnected(event)
    return 'system.connected'
  }

  if (deviceEventTypes.has(event.eventType)) {
    if (event.resource.type !== 'device' || !event.resource.laboratoryId) {
      return 'invalid-message'
    }
    routes.onDeviceEvent(event)
    return 'device.event'
  }

  if (event.eventType === realtimeEventTypes.ruleActionGroupExecuted) {
    const data = event.data
    if (
      event.resource.type !== 'runtime'
      || event.resource.id !== data.runtimeId
      || typeof data.runtimeId !== 'string'
      || typeof data.actionGroupId !== 'string'
      || typeof data.deviceConditionGroupId !== 'string'
      || typeof data.timeConditionGroupId !== 'string'
      || typeof data.eventId !== 'string'
      || data.eventId !== event.eventId
      || !isInstantValue(data.matchedAt)
      || !isInstantValue(data.completedAt)
      || !Array.isArray(data.actions)
      || data.actions.some((action) => !isObject(action)
        || typeof action.index !== 'number'
        || (action.type !== 'Control' && action.type !== 'Report')
        || (action.targetId !== null && typeof action.targetId !== 'string')
        || !Array.isArray(action.userIds)
        || action.userIds.some((id) => typeof id !== 'string')
        || !Array.isArray(action.reportTypes)
        || action.reportTypes.some((type) => typeof type !== 'string')
        || (action.content !== null && typeof action.content !== 'string')
        || typeof action.message !== 'string'
        || (action.completedAt !== null && !isInstantValue(action.completedAt))
        || !['SUCCESS', 'FAILED', 'NOT_IMPLEMENTED'].includes(String(action.status)))
    ) {
      return 'invalid-message'
    }
    routes.onRuleExecution?.(event as RuleExecutionEvent)
    return 'rule.action-group.executed'
  }

  return 'unknown-event'
}
