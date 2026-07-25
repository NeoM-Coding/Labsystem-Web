import type { DeviceType, TelemetryRecord } from './types'

const openingKeys = new Set(['opened', 'isOpen'])

export const telemetryLabel: Record<string, string> = {
  temperature: '温度',
  humidity: '湿度',
  co2: 'CO₂',
  opened: '状态',
  isOpen: '状态',
  locked: '锁定',
  mode: '运行模式',
  speed: '风速',
  brightness: '亮度',
  voltage: '电压',
  current: '电流',
  power: '功率',
  energy: '累计能耗',
  leakage: '漏电电流',
  light: '光照强度',
  smoke: '烟雾浓度',
  fixed: '检修状态',
  lockStatus: '门锁状态',
  delayTime: '关门延时',
  roomTemperature: '室温',
  errorCode: '错误码',
  address: '设备地址',
  selfId: '设备内编号',
}

const deviceTelemetryLabels: Partial<Record<DeviceType, Record<string, string>>> = {
  AirCondition: {
    temperature: '设定温度',
    selfId: '内机编号',
  },
  Sensor: {
    selfId: '探头编号',
  },
  Light: {
    selfId: '灯具编号',
  },
}

export function telemetryLabelForDevice(deviceType: DeviceType, key: string) {
  return deviceTelemetryLabels[deviceType]?.[key] ?? telemetryLabel[key] ?? key
}

const summaryFieldOrder: Record<DeviceType, readonly string[]> = {
  Access: ['opened', 'locked', 'delayTime'],
  AirCondition: ['opened', 'locked', 'mode', 'temperature'],
  Sensor: ['smoke', 'temperature', 'humidity'],
  CircuitBreak: ['opened', 'leakage', 'power'],
  Light: ['opened', 'locked'],
}

const detailFieldOrder: Record<DeviceType, readonly string[]> = {
  Access: ['opened', 'locked', 'lockStatus', 'delayTime', 'address'],
  AirCondition: ['opened', 'locked', 'mode', 'temperature', 'roomTemperature', 'speed', 'errorCode', 'address', 'selfId'],
  Sensor: ['smoke', 'temperature', 'humidity', 'light', 'address', 'selfId'],
  CircuitBreak: ['opened', 'fixed', 'locked', 'leakage', 'temperature', 'voltage', 'current', 'power', 'energy', 'address'],
  Light: ['opened', 'locked', 'address', 'selfId'],
}

export function telemetryEntriesForDevice(
  deviceType: DeviceType,
  record: TelemetryRecord,
  presentation: 'summary' | 'detail' = 'summary',
): [string, TelemetryRecord[string]][] {
  const configuredOrder = presentation === 'summary'
    ? summaryFieldOrder[deviceType]
    : detailFieldOrder[deviceType]
  const configuredKeys = new Set(configuredOrder)
  const ordered = configuredOrder
    .filter((key) => Object.hasOwn(record, key))
    .map((key) => [key, record[key]] as [string, TelemetryRecord[string]])

  if (presentation === 'summary') return ordered

  const remaining = Object.entries(record)
    .filter(([key]) => !configuredKeys.has(key))
    .sort(([left], [right]) => left.localeCompare(right))
  return [...ordered, ...remaining]
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
  if (key === 'locked' && typeof value === 'boolean') return value ? '已锁定' : '未锁定'
  if (key === 'fixed' && typeof value === 'boolean') return value ? '维修中' : '正常'
  if (key === 'mode' && typeof value === 'string') {
    return {
      cooling: '制冷',
      cool: '制冷',
      heating: '制热',
      heat: '制热',
      dehumidification: '除湿',
      dry: '除湿',
      airsupply: '送风',
      fan: '送风',
    }[value.toLowerCase()] ?? '未知模式'
  }
  if (key === 'speed' && typeof value === 'string') {
    return {
      low: '低风',
      middle: '中风',
      medium: '中风',
      high: '高风',
      auto: '自动',
    }[value.toLowerCase()] ?? '未知风速'
  }
  if (key === 'errorCode' && value === 0) return '正常'
  if (typeof value === 'boolean') return value ? '是' : '否'
  const unit = key === 'temperature' ? ' °C'
    : key === 'roomTemperature' ? ' °C'
    : key === 'humidity' ? ' %'
      : key === 'co2' ? ' ppm'
        : key === 'brightness' ? ' %'
          : key === 'voltage' ? ' V'
            : key === 'current' ? ' A'
              : key === 'power' ? ' W'
                : key === 'energy' ? ' kWh'
                  : key === 'leakage' ? ' mA'
                    : key === 'light' ? ' lx'
                      : key === 'delayTime' ? ' 秒'
                        : ''
  return `${String(value)}${unit}`
}

export function isOpeningStatus(key: string) {
  return openingKeys.has(key)
}
