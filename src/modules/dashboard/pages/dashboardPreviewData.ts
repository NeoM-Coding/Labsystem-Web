import type { DashboardData } from '../dashboardModel'
import type { DeviceType } from '@/modules/device/types'

export const previewNow = Date.parse('2026-10-31T02:00:00Z')
const at = new Date(previewNow).toISOString()
export const dashboardPreviewData: DashboardData = {
  laboratories: [
    ['lab-1', '智能控制教室 101', '教学楼 A'],
    ['lab-2', '电气实验教室 202', '教学楼 A'],
    ['lab-3', '环境监测教室 301', '实验楼 B'],
    ['lab-4', '综合教室 302', '实验楼 B'],
  ].map(([id, laboratoryName, buildingName]) => ({ id, laboratoryName, buildingName, orgName: '工程学院', extra: null, managers: [], createAt: at, updateAt: at })),
  devices: [
    ['air-1', 'AirCondition', 'lab-1'], ['air-2', 'AirCondition', 'lab-2'],
    ['light-1', 'Light', 'lab-1'], ['light-2', 'Light', 'lab-2'],
    ['access-1', 'Access', 'lab-1'], ['access-2', 'Access', 'lab-2'],
    ['break-1', 'CircuitBreak', 'lab-1'], ['break-2', 'CircuitBreak', 'lab-2'],
    ['sensor-1', 'Sensor', 'lab-3'],
  ].map(([id, deviceType, belongTo], index) => ({ id, deviceType: deviceType as DeviceType, belongTo, deviceName: id, gatewayId: 'gateway-1', address: index, polling: true })),
  snapshots: [
    ['air-1', 'AirCondition', 'lab-1', true, true], ['air-2', 'AirCondition', 'lab-2', false, true],
    ['light-1', 'Light', 'lab-1', true, true], ['light-2', 'Light', 'lab-2', true, false],
    ['access-1', 'Access', 'lab-1', false, true], ['access-2', 'Access', 'lab-2', null, true],
    ['break-1', 'CircuitBreak', 'lab-1', true, true], ['break-2', 'CircuitBreak', 'lab-2', false, true],
    ['sensor-1', 'Sensor', 'lab-3', true, true],
  ].map(([deviceId, deviceType, laboratoryId, opened, online]) => ({
    deviceId: String(deviceId), deviceType: deviceType as DeviceType, laboratoryId: String(laboratoryId),
    record: { opened: opened as boolean | null }, online: Boolean(online), occurredAt: at,
  })),
}
