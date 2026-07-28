import type { DeviceType } from './types'

export type DeviceFieldKind = 'number' | 'boolean' | 'enum'

export interface DeviceFieldOption {
  value: string
  label: string
}

export interface DeviceFieldSpec {
  field: string
  label: string
  kind: DeviceFieldKind
  unit?: string
  options?: DeviceFieldOption[]
}

const booleanOptions: DeviceFieldOption[] = [
  { value: 'true', label: '是' },
  { value: 'false', label: '否' },
]

const openedOptions: DeviceFieldOption[] = [
  { value: 'true', label: '开启' },
  { value: 'false', label: '关闭' },
]

const breakerOpenedOptions: DeviceFieldOption[] = [
  { value: 'true', label: '合闸' },
  { value: 'false', label: '分闸' },
]

const catalog: Record<DeviceType, readonly DeviceFieldSpec[]> = {
  Access: [
    { field: 'opened', label: '状态', kind: 'boolean', options: openedOptions },
    { field: 'locked', label: '锁定状态', kind: 'boolean', options: booleanOptions },
    { field: 'lockStatus', label: '门锁状态码', kind: 'number' },
    { field: 'delayTime', label: '关门延时', kind: 'number', unit: '秒' },
    { field: 'address', label: '设备地址', kind: 'number' },
  ],
  AirCondition: [
    { field: 'opened', label: '状态', kind: 'boolean', options: openedOptions },
    {
      field: 'mode',
      label: '运行模式',
      kind: 'enum',
      options: [
        { value: 'Cooling', label: '制冷' },
        { value: 'Heating', label: '制热' },
        { value: 'Dehumidification', label: '除湿' },
        { value: 'AirSupply', label: '送风' },
      ],
    },
    { field: 'temperature', label: '设定温度', kind: 'number', unit: '°C' },
    { field: 'roomTemperature', label: '室温', kind: 'number', unit: '°C' },
    {
      field: 'speed',
      label: '风速',
      kind: 'enum',
      options: [
        { value: 'Auto', label: '自动' },
        { value: 'Low', label: '低风' },
        { value: 'Middle', label: '中风' },
        { value: 'High', label: '高风' },
      ],
    },
    { field: 'errorCode', label: '错误码', kind: 'number' },
    { field: 'address', label: '设备地址', kind: 'number' },
    { field: 'selfId', label: '内机编号', kind: 'number' },
  ],
  CircuitBreak: [
    { field: 'opened', label: '状态', kind: 'boolean', options: breakerOpenedOptions },
    { field: 'fixed', label: '检修状态', kind: 'boolean', options: booleanOptions },
    { field: 'locked', label: '锁定状态', kind: 'boolean', options: booleanOptions },
    { field: 'leakage', label: '漏电电流', kind: 'number', unit: 'mA' },
    { field: 'temperature', label: '线温', kind: 'number', unit: '°C' },
    { field: 'voltage', label: '电压', kind: 'number', unit: 'V' },
    { field: 'current', label: '电流', kind: 'number', unit: 'A' },
    { field: 'power', label: '功率', kind: 'number', unit: 'W' },
    { field: 'energy', label: '累计能耗', kind: 'number', unit: 'kWh' },
    { field: 'address', label: '设备地址', kind: 'number' },
  ],
  Light: [
    { field: 'opened', label: '状态', kind: 'boolean', options: openedOptions },
    { field: 'locked', label: '锁定状态', kind: 'boolean', options: booleanOptions },
    { field: 'address', label: '设备地址', kind: 'number' },
    { field: 'selfId', label: '灯具编号', kind: 'number' },
  ],
  Sensor: [
    { field: 'smoke', label: '烟雾浓度', kind: 'number' },
    { field: 'temperature', label: '温度', kind: 'number', unit: '°C' },
    { field: 'humidity', label: '湿度', kind: 'number', unit: '%' },
    { field: 'light', label: '光照强度', kind: 'number', unit: 'lx' },
    { field: 'address', label: '设备地址', kind: 'number' },
    { field: 'selfId', label: '探头编号', kind: 'number' },
  ],
}

export const strategyOperatorOptions = {
  number: [
    { value: 'EQ', label: '等于' },
    { value: 'NE', label: '不等于' },
    { value: 'GT', label: '大于' },
    { value: 'GE', label: '大于等于' },
    { value: 'ST', label: '小于' },
    { value: 'SE', label: '小于等于' },
  ],
  boolean: [
    { value: 'EQ', label: '等于' },
    { value: 'NE', label: '不等于' },
  ],
  enum: [
    { value: 'EQ', label: '等于' },
    { value: 'NE', label: '不等于' },
  ],
} as const

export function deviceFieldsFor(deviceType: DeviceType) {
  return catalog[deviceType]
}

export function deviceField(deviceType: DeviceType, field: string) {
  return catalog[deviceType].find((item) => item.field === field)
}

export function displayDeviceFieldValue(
  deviceType: DeviceType,
  field: string,
  value: string | number | boolean | null,
) {
  if (value === null) return '—'
  const spec = deviceField(deviceType, field)
  const option = spec?.options?.find((item) => item.value.toLowerCase() === String(value).toLowerCase())
  if (option) return option.label
  return `${String(value)}${spec?.unit ? ` ${spec.unit}` : ''}`
}
