import { apiRequest, http } from '@/shared/api/http'
import type { TelemetryDashboard, TelemetryKind, TelemetryRange, TelemetryFilters, TelemetryFilterOptions, TelemetryDataSource } from '../types/telemetry'

function appendDimensions(params: URLSearchParams, filters: Partial<TelemetryFilters>) {
  for (const key of ['buildingNames', 'orgNames', 'laboratoryIds', 'deviceIds'] as const) {
    filters[key]?.forEach((value) => params.append(key, value))
  }
}
export function getTelemetryDashboard(kind: TelemetryKind, range: TelemetryRange, laboratoryIds: string[], startDate?: string, endDate?: string, dimensions?: Partial<TelemetryFilters>) {
  const params = new URLSearchParams({ range })
  appendDimensions(params, { ...dimensions, laboratoryIds })
  if (range === 'CUSTOM' && startDate && endDate) { params.set('startDate', startDate); params.set('endDate', endDate) }
  return apiRequest<TelemetryDashboard>(
    () => http.get('/bi/' + kind + '/dashboard', { params }), '加载统计数据失败',
  )
}
export function getTelemetryOptions(kind: TelemetryKind, filters: TelemetryFilters) {
  const params = new URLSearchParams()
  appendDimensions(params, { buildingNames: filters.buildingNames, orgNames: filters.orgNames, laboratoryIds: filters.laboratoryIds })
  return apiRequest<TelemetryFilterOptions>(
    () => http.get('/bi/' + kind + '/options', { params }), '加载筛选选项失败',
  )
}
export const telemetryDataSource: TelemetryDataSource = {
  options: getTelemetryOptions,
  dashboard: (kind, filters) => getTelemetryDashboard(kind, filters.range, filters.laboratoryIds, filters.startDate, filters.endDate, filters),
}
