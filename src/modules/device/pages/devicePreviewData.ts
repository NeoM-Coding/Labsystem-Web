import type { Device, DeviceTelemetrySnapshot, Gateway } from '../types'

export const previewDevices: Device[] = [
  { id: 'dev-access-01', deviceName: '东门门禁', belongTo: 'lab-101', deviceType: 'Access', polling: true, gatewayId: 'gw-main', address: 1, locked: true },
  { id: 'dev-air-01', deviceName: '中央空调 A', belongTo: 'lab-101', deviceType: 'AirCondition', polling: true, gatewayId: 'gw-main', address: 2, selfId: 1, groupId: 'air-group-01' },
  { id: 'dev-sensor-01', deviceName: '环境传感器', belongTo: 'lab-102', deviceType: 'Sensor', polling: true, gatewayId: 'gw-main', address: 3, selfId: 1 },
  { id: 'dev-light-01', deviceName: '实验区照明', belongTo: 'lab-102', deviceType: 'Light', polling: true, gatewayId: 'gw-secondary', address: 4, selfId: 1 },
  { id: 'dev-light-02', deviceName: '走廊照明', belongTo: 'lab-102', deviceType: 'Light', polling: true, gatewayId: 'gw-secondary', address: 7, selfId: 1 },
  { id: 'dev-break-01', deviceName: '主回路断路器', belongTo: 'lab-201', deviceType: 'CircuitBreak', polling: true, gatewayId: 'gw-secondary', address: 5 },
  { id: 'dev-sensor-02', deviceName: '储物间传感器', belongTo: 'lab-201', deviceType: 'Sensor', polling: false, gatewayId: 'gw-secondary', address: 6, selfId: 1 },
]

export const previewGateways: Gateway[] = [
  { id: 'gw-main', gatewayName: '创新楼主网关', usingIn: ['lab-101', 'lab-102'], gatewayType: 'RS485', sendTopic: 'lab/gateway/main/send', acceptTopic: 'lab/gateway/main/accept' },
  { id: 'gw-secondary', gatewayName: '工程中心网关', usingIn: ['lab-201'], gatewayType: 'RS485', sendTopic: 'lab/gateway/secondary/send', acceptTopic: 'lab/gateway/secondary/accept' },
]

export function createPreviewSnapshots(now = Date.now()): DeviceTelemetrySnapshot[] {
  const recent = new Date(now - 8_000).toISOString()
  const stale = new Date(now - 130_000).toISOString()
  return [
    { deviceId: 'dev-access-01', laboratoryId: 'lab-101', deviceType: 'Access', record: { opened: false, locked: true }, occurredAt: recent, online: true },
    { deviceId: 'dev-air-01', laboratoryId: 'lab-101', deviceType: 'AirCondition', record: { opened: true, temperature: 24, mode: 'cool', speed: 'medium' }, occurredAt: recent, online: true },
    { deviceId: 'dev-sensor-01', laboratoryId: 'lab-102', deviceType: 'Sensor', record: { temperature: 23.6, humidity: 48, co2: 612 }, occurredAt: recent, online: true },
    { deviceId: 'dev-light-01', laboratoryId: 'lab-102', deviceType: 'Light', record: { opened: true, brightness: 72 }, occurredAt: recent, online: true },
    { deviceId: 'dev-light-02', laboratoryId: 'lab-102', deviceType: 'Light', record: { opened: false, brightness: 0 }, occurredAt: recent, online: true },
    { deviceId: 'dev-break-01', laboratoryId: 'lab-201', deviceType: 'CircuitBreak', record: { opened: true, voltage: 220.4, current: 4.8 }, occurredAt: recent, online: true },
    { deviceId: 'dev-sensor-02', laboratoryId: 'lab-201', deviceType: 'Sensor', record: { temperature: 26.8, humidity: 57 }, occurredAt: stale, online: false },
  ]
}
