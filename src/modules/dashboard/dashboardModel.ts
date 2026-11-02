import type { Laboratory } from '@/modules/laboratory/types'
import type { Device, DeviceTelemetrySnapshot } from '@/modules/device/types'
import { isTelemetryOnline } from '@/modules/device/store/deviceStore'

export const overviewTypes = ['AirCondition', 'Light', 'Access', 'CircuitBreak'] as const
export type OverviewType = typeof overviewTypes[number]
export const typeLabels: Record<OverviewType, string> = {
  AirCondition: '空调', Light: '照明', Access: '门禁', CircuitBreak: '断路器',
}
export const statusKeys = ['opened', 'closed', 'offline', 'unknown'] as const
export type OverviewStatus = typeof statusKeys[number]
export type Counts = Record<OverviewStatus, number> & { total: number }
export interface DashboardData {
  laboratories: Laboratory[]
  devices: Device[]
  snapshots: DeviceTelemetrySnapshot[]
}
export function emptyCounts(): Counts {
  return { total: 0, opened: 0, closed: 0, offline: 0, unknown: 0 }
}
export function statusLabel(status: OverviewStatus, type?: OverviewType) {
  if (status === 'opened') return type === 'CircuitBreak' ? '合闸' : '开启'
  if (status === 'closed') return type === 'CircuitBreak' ? '分闸' : '关闭'
  return status === 'offline' ? '离线' : '状态未知'
}
export function summarizeDashboard(data: DashboardData, now: number) {
  const makeCategories = () => Object.fromEntries(overviewTypes.map((type) => [type, emptyCounts()])) as Record<OverviewType, Counts>
  const categories = makeCategories()
  const rooms = [...new Map(data.laboratories.map((room) => [room.id, room])).values()]
    .map((laboratory) => ({ laboratory, total: 0, categories: makeCategories() }))
    .sort((a, b) => a.laboratory.buildingName.localeCompare(b.laboratory.buildingName, 'zh-CN') || a.laboratory.laboratoryName.localeCompare(b.laboratory.laboratoryName, 'zh-CN', { numeric: true }))
  const roomsById = new Map(rooms.map((room) => [room.laboratory.id, room]))
  const snapshots = new Map(data.snapshots.map((snapshot) => [snapshot.deviceId, snapshot]))
  const total = emptyCounts()
  const seen = new Set<string>()
  for (const device of data.devices) {
    if (!overviewTypes.includes(device.deviceType as OverviewType) || seen.has(device.id)) continue
    const room = roomsById.get(device.belongTo)
    if (!room) continue
    seen.add(device.id)
    const type = device.deviceType as OverviewType
    const candidate = snapshots.get(device.id)
    const snapshot = candidate?.laboratoryId === device.belongTo && candidate.deviceType === type ? candidate : undefined
    const online = snapshot && isTelemetryOnline({ ...snapshot, receivedAt: '', onlineSignalAt: snapshot.occurredAt }, now)
    const state: OverviewStatus = !online ? 'offline'
      : snapshot.record.opened === true ? 'opened'
      : snapshot.record.opened === false ? 'closed' : 'unknown'
    for (const counts of [total, categories[type], room.categories[type]]) {
      counts.total += 1
      counts[state] += 1
    }
    room.total += 1
  }
  return { total, categories, rooms }
}
