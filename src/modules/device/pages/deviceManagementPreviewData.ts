import type { Laboratory } from '@/modules/laboratory/types'
import type { Device, Gateway } from '../types'
import type {
  DeviceDraft,
  DeviceManagementDataSource,
  GatewayDraft,
} from '../components/DeviceManagement'

const laboratories: Laboratory[] = [
  { id: 'lab-101', laboratoryName: '16-201', buildingName: '16栋', orgName: '电子技术学院', extra: null, managers: [], createAt: '', updateAt: '' },
  { id: 'lab-102', laboratoryName: '16-202', buildingName: '16栋', orgName: '电子技术学院', extra: null, managers: [], createAt: '', updateAt: '' },
]

let devices: Device[] = [
  { id: 'device-air-01', deviceName: '中央空调 A', belongTo: 'lab-101', deviceType: 'AirCondition', polling: true, gatewayId: 'gateway-01', address: 31, selfId: 1, groupId: 'group-a', locked: false },
  { id: 'device-sensor-01', deviceName: '环境探头', belongTo: 'lab-102', deviceType: 'Sensor', polling: true, gatewayId: 'gateway-01', address: 61, selfId: 1 },
]
let gateways: Gateway[] = [
  { id: 'gateway-01', gatewayName: '16栋 RS485 主网关', usingIn: ['lab-101', 'lab-102'], gatewayType: 'RS485', sendTopic: 'lab/16/send', acceptTopic: 'lab/16/accept' },
]
let sequence = 10

export function createDeviceManagementPreviewDataSource(
  onEvent: (message: string) => void,
): DeviceManagementDataSource {
  const nextId = (prefix: string) => `${prefix}-${++sequence}`
  const announce = (message: string) => {
    onEvent(message)
    return Promise.resolve()
  }
  return {
    listDevices: async (laboratoryIds = []) => structuredClone(
      laboratoryIds.length === 0
        ? devices
        : devices.filter((device) => laboratoryIds.includes(device.belongTo)),
    ),
    listGateways: async (laboratoryIds = []) => structuredClone(
      laboratoryIds.length === 0
        ? gateways
        : gateways.filter((gateway) => gateway.usingIn.some((id) => laboratoryIds.includes(id))),
    ),
    getDevice: async (deviceId) => {
      const device = devices.find((item) => item.id === deviceId)
      if (!device) throw new Error('设备不存在')
      return structuredClone(device)
    },
    getGateway: async (gatewayId) => {
      const gateway = gateways.find((item) => item.id === gatewayId)
      if (!gateway) throw new Error('网关不存在')
      return structuredClone(gateway)
    },
    listLaboratories: async () => structuredClone(laboratories),
    createDevice: async (draft: DeviceDraft) => {
      const created = { ...draft, id: nextId('device') }
      devices = [created, ...devices]
      await announce(`创建设备：${created.deviceName}`)
      return structuredClone(created)
    },
    updateDevice: async (id, draft) => {
      const updated = { ...draft, id }
      devices = devices.map((device) => device.id === id ? updated : device)
      await announce(`更新设备：${updated.deviceName}`)
      return structuredClone(updated)
    },
    deleteDevice: async (id) => {
      const target = devices.find((device) => device.id === id)
      devices = devices.filter((device) => device.id !== id)
      await announce(`删除设备：${target?.deviceName ?? id}`)
    },
    setPolling: async (id, enabled) => {
      devices = devices.map((device) => device.id === id ? { ...device, polling: enabled } : device)
      await announce(`${enabled ? '开启' : '关闭'}轮询：${id}`)
    },
    createGateway: async (draft: GatewayDraft) => {
      const created = { ...draft, id: nextId('gateway') }
      gateways = [created, ...gateways]
      await announce(`创建网关：${created.gatewayName}`)
      return structuredClone(created)
    },
    updateGateway: async (id, draft) => {
      const updated = { ...draft, id }
      gateways = gateways.map((gateway) => gateway.id === id ? updated : gateway)
      await announce(`更新网关：${updated.gatewayName}`)
      return structuredClone(updated)
    },
    deleteGateway: async (id) => {
      if (devices.some((device) => device.gatewayId === id)) {
        throw new Error('该网关仍有关联设备，请先删除或迁移设备')
      }
      const target = gateways.find((gateway) => gateway.id === id)
      gateways = gateways.filter((gateway) => gateway.id !== id)
      await announce(`删除网关：${target?.gatewayName ?? id}`)
    },
  }
}
