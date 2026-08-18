import { apiRequest, http } from '@/shared/api/http'
import type {
  AlertLogQuery,
  AuditLogQuery,
  AuditLog,
  PageResult,
  RuleAlertLog,
} from '../types'

const compact = <T extends object>(params: T) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
)

export const pageAuditLogs = (query: AuditLogQuery) => apiRequest<PageResult<AuditLog>>(
  () => http.get('/audit-logs', { params: compact(query) }),
  '加载审计日志失败',
)

export const pageAlertLogs = (query: AlertLogQuery) => apiRequest<PageResult<RuleAlertLog>>(
  () => http.get('/smart-strategies/alert-logs', {
    params: compact({
      ...query,
      matchedFrom: query.matchedFrom ? new Date(query.matchedFrom).toISOString() : undefined,
      matchedTo: query.matchedTo ? new Date(query.matchedTo).toISOString() : undefined,
    }),
  }),
  '加载智能控制告警日志失败',
)
