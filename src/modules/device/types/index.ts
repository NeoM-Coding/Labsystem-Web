import type { ApiResponse } from '@/modules/laboratory/types'

export type { ApiResponse }

export type DeviceType =
  | 'Access'
  | 'AirCondition'
  | 'Sensor'
  | 'CircuitBreak'
  | 'Light'

export type DeviceTypeFilter = 'all' | DeviceType
export type DeviceEntityMode = 'device' | 'gateway'
export type OnlineFilter = 'all' | 'online' | 'offline'
export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'
export type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'offline'

export interface Device {
  id: string
  deviceName: string
  belongTo: string
  deviceType: DeviceType
  polling: boolean
  gatewayId: string
  address: number
  selfId?: number
  socketGatewayId?: string
  groupId?: string
  locked?: boolean
  createAt?: string
  updateAt?: string
}

export interface Gateway {
  id: string
  gatewayName: string
  usingIn: string[]
  gatewayType: 'RS485'
  sendTopic: string
  acceptTopic: string
  createAt?: string
  updateAt?: string
}

export type TelemetryRecord = Record<string, string | number | boolean | null>

export interface DeviceTelemetrySnapshot {
  deviceId: string
  laboratoryId: string
  deviceType: DeviceType
  record: TelemetryRecord
  occurredAt: string | null
  online: boolean
}

export interface DeviceTelemetry extends DeviceTelemetrySnapshot {
  receivedAt: string
  onlineSignalAt: string | null
}

export interface RealtimeResource {
  type: string
  id: string
  laboratoryId: string | null
}

export interface RealtimeEvent {
  version: string
  eventId: string
  eventType: string
  occurredAt: string
  source: string
  traceId: string | null
  resource: RealtimeResource
  data: Record<string, unknown>
}
