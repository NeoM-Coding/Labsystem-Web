export type TelemetryKind = 'air-condition' | 'energy'
export type TelemetryRange = 'TODAY' | 'CURRENT_MONTH' | 'CUSTOM'
export interface TelemetryPoint { key: string; label: string; value: number; incomplete: boolean }
export interface TelemetryDashboard {
  kind: 'AIR_CONDITION' | 'ENERGY'
  periodStart: string
  periodEnd: string
  calculatedAt: string
  incomplete: boolean
  qualityNotes: string[]
  metrics: Record<string, number>
  timeline: TelemetryPoint[]
  laboratoryRanking: TelemetryPoint[]
  deviceRanking: TelemetryPoint[]
  modes: TelemetryPoint[]
  devices: Array<{
    deviceId: string; name: string; laboratoryId: string; observedAt: string | null
    stale: boolean; opened: boolean; values: Record<string, number>
  }>
  rows: TelemetryUsageRow[]
  faults: Array<{ deviceId: string; startAt: string; endAt: string; errorCode: number }>
}

export interface TelemetryUsageRow {
  deviceId: string; deviceName: string; groupId: string | null
  laboratoryId: string; laboratoryName: string
  orgName: string | null; buildingName: string | null
  value: number; incomplete: boolean; coverage: number
}
export interface TelemetryFilters {
  range: TelemetryRange; startDate: string; endDate: string
  buildingNames: string[]; orgNames: string[]; laboratoryIds: string[]; deviceIds: string[]
}
export interface TelemetryOption { value: string; label: string; description?: string | null }
export interface TelemetryFilterOptions {
  buildings: TelemetryOption[]; organizations: TelemetryOption[]
  laboratories: TelemetryOption[]; devices: TelemetryOption[]
}
export interface TelemetryDataSource {
  options: (kind: TelemetryKind, filters: TelemetryFilters) => Promise<TelemetryFilterOptions>
  dashboard: (kind: TelemetryKind, filters: TelemetryFilters) => Promise<TelemetryDashboard>
}
