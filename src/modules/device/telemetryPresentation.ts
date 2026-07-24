import type { DeviceType, TelemetryRecord } from './types'

const openingKeys = new Set(['opened', 'isOpen'])

export const telemetryLabel: Record<string, string> = {
  temperature: '温度',
  humidity: '湿度',
  co2: 'CO₂',
  opened: '状态',
  isOpen: '状态',
  locked: '锁定',
  mode: '模式',
  speed: '风速',
  brightness: '亮度',
  voltage: '电压',
  current: '电流',
  power: '功率',
}

export function prioritizedTelemetryEntries(
  record: TelemetryRecord,
  limit = 3,
): [string, TelemetryRecord[string]][] {
  const entries = Object.entries(record)
  const opening = entries.find(([key, value]) => openingKeys.has(key) && typeof value === 'boolean')
  const remaining = entries.filter(([key]) => !openingKeys.has(key))
  return (opening ? [opening, ...remaining] : remaining).slice(0, limit)
}

export function displayTelemetryValue(
  deviceType: DeviceType,
  key: string,
  value: TelemetryRecord[string],
) {
  if (value === null) return '—'
  if (openingKeys.has(key) && typeof value === 'boolean') {
    if (deviceType === 'CircuitBreak') return value ? '合闸' : '分闸'
    return value ? '开启' : '关闭'
  }
  if (typeof value === 'boolean') return value ? '是' : '否'
  const unit = key === 'temperature' ? ' °C'
    : key === 'humidity' ? ' %'
      : key === 'co2' ? ' ppm'
        : key === 'brightness' ? ' %'
          : key === 'voltage' ? ' V'
            : key === 'current' ? ' A'
              : key === 'power' ? ' W'
                : ''
  return `${String(value)}${unit}`
}

export function isOpeningStatus(key: string) {
  return openingKeys.has(key)
}
