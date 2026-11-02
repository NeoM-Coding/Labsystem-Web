import type { TelemetryDataSource, TelemetryFilters, TelemetryUsageRow, TelemetryFilterOptions, TelemetryKind } from '../types/telemetry'

const laboratories = [
  { id: 'lab-1', name: '电工电子实验室', building: '实验一号楼', org: '电气工程学院' },
  { id: 'lab-2', name: '自动控制实验室', building: '实验一号楼', org: '电气工程学院' },
  { id: 'lab-3', name: '计算机组成实验室', building: '信息楼', org: '计算机学院' },
  { id: 'lab-4', name: '物联网创新实验室', building: '信息楼', org: '计算机学院' },
]
const selected = (values: string[], value: string | null) => values.length === 0 || (value !== null && values.includes(value))
function baseRows(kind: TelemetryKind): TelemetryUsageRow[] {
  return Array.from({ length: 8 }, (_, index) => {
    const lab = laboratories[index % laboratories.length]
    const air = kind === 'air-condition'
    return { deviceId: (air ? 'air-' : 'breaker-') + (index + 1), deviceName: lab.name.slice(0, 4) + (air ? '·内机 ' : '·空开 ') + String(index + 1).padStart(2, '0'),
      groupId: air ? (index < 4 ? 'AC-01' : 'AC-02') : null, laboratoryId: lab.id, laboratoryName: lab.name, buildingName: lab.building, orgName: lab.org,
      value: air ? [12.75, 10.5, 8.25, 6.75, 5.5, 4.25, 3.5, 2.75][index] : [48.62, 36.28, 29.54, 24.76, 18.9, 15.32, 12.65, 8.48][index],
      incomplete: false, coverage: 1 }
  })
}
export function previewOptions(kind: TelemetryKind, filters: TelemetryFilters): TelemetryFilterOptions {
  const labs = laboratories.filter((lab) => selected(filters.buildingNames, lab.building) && selected(filters.orgNames, lab.org))
  const devices = baseRows(kind).filter((row) => labs.some((lab) => lab.id === row.laboratoryId) && selected(filters.laboratoryIds, row.laboratoryId))
  return {
    buildings: [...new Set(laboratories.map((lab) => lab.building))].map((name) => ({ value: name, label: name })),
    organizations: [...new Set(laboratories.map((lab) => lab.org))].map((name) => ({ value: name, label: name })),
    laboratories: labs.map((lab) => ({ value: lab.id, label: lab.name, description: lab.building + ' · ' + lab.org })),
    devices: devices.map((row) => ({ value: row.deviceId, label: row.deviceName, description: row.laboratoryName })),
  }
}
export function createTelemetryPreview(state: string): TelemetryDataSource {
  return {
    options: async (kind, filters) => previewOptions(kind, filters),
    dashboard: async (kind, filters) => {
      if (state === 'loading') return new Promise(() => {})
      if (state === 'error') throw new Error('示例：统计服务暂时不可用')
      const rows = state === 'empty' || filters.startDate > '2026-11-02' || filters.endDate < '2026-11-02' ? [] : baseRows(kind)
        .filter((row) => selected(filters.buildingNames, row.buildingName) && selected(filters.orgNames, row.orgName) && selected(filters.laboratoryIds, row.laboratoryId) && selected(filters.deviceIds, row.deviceId))
        .map((row, index, all) => ({ ...row, incomplete: state === 'partial' && index === Math.min(2, all.length - 1), coverage: state === 'partial' && index === Math.min(2, all.length - 1) ? 0.72 : 1 }))
      const total = rows.reduce((sum, row) => sum + row.value, 0)
      const weights = [0, 0, 0, 0, 0, 0.04, 0.1, 0.14, 0.18, 0.2, 0.19, 0.15]
      const hours = filters.startDate === filters.endDate
      const buckets = hours ? weights : [0.28, 0.72]
      const timeline = rows.length ? buckets.map((weight, index) => {
        const key = hours ? '2026-11-02T' + String(index).padStart(2, '0') + ':00' : index === 0 ? filters.startDate : filters.endDate
        return { key, label: key, value: total * weight, incomplete: state === 'partial' && (index === 3 || index === 8) }
      }) : []
      return { kind: kind === 'air-condition' ? 'AIR_CONDITION' : 'ENERGY', periodStart: filters.startDate, periodEnd: filters.endDate,
        calculatedAt: '2026-11-02T12:00:00', incomplete: rows.some((row) => row.incomplete),
        qualityNotes: rows.some((row) => row.incomplete) ? ['存在断报或缺少边界读数，缺失区间不代表零使用。'] : [],
        metrics: { runningHours: kind === 'air-condition' ? total : 0, energyKwh: kind === 'energy' ? total : 0, coverage: rows.length ? rows.reduce((sum, row) => sum + row.coverage, 0) / rows.length : 1 },
        rows, timeline,
        laboratoryRanking: [], deviceRanking: [], modes: [], devices: [], faults: [] }
    },
  }
}
