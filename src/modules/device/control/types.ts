import type { Device, DeviceType } from '../types'

export type CommandLine =
  | 'OPEN_AIR_CONDITION_RS485'
  | 'CLOSE_AIR_CONDITION_RS485'
  | 'ENHANCE_CONTROL_AIR_CONDITION'
  | 'REQUEST_AIR_CONDITION_DATA_RS485'
  | 'OPEN_ACCESS_ONCE'
  | 'CLOSE_ACCESS_ONCE'
  | 'REQUEST_ACCESS_DATA'
  | 'SET_ACCESS_DELAY'
  | 'OPEN_CIRCUITBREAK'
  | 'CLOSE_CIRCUITBREAK'
  | 'REQUEST_CIRCUITBREAK_DATA'
  | 'OPEN_LIGHT'
  | 'CLOSE_LIGHT'
  | 'LOCK_LIGHT'
  | 'UNLOCK_LIGHT'
  | 'REQUEST_LIGHT_DATA'
  | 'REQUEST_SENSOR_DATA'

export interface CommandOption {
  value: number
  label: string
}

export interface CommandInputSpec {
  name: string
  label: string
  unit?: string
  options?: CommandOption[]
  min?: number
  max?: number
}

export interface DeviceCommandSpec {
  commandLine: CommandLine
  label: string
  description: string
  tone: 'normal' | 'caution'
  inputs: CommandInputSpec[]
}

export interface MqttResponse {
  gatewayId: string
  payload: number[]
}

export interface DeviceCommandResult {
  deviceId: string
  success: boolean
  response: MqttResponse | null
  message: string
}

export interface DeviceControlRequest {
  commandLine: CommandLine
  args: number[]
  type: DeviceType
}

export interface DeviceControlDataSource {
  single: (request: DeviceControlRequest & { deviceId: string }) => Promise<DeviceCommandResult>
  multi: (request: DeviceControlRequest & { deviceIds: string[] }) => Promise<DeviceCommandResult[]>
}

export interface DeviceControlDialogProps {
  open: boolean
  targets: Device[]
  onClose: () => void
  dataSource?: DeviceControlDataSource
  onCompleted?: (results: DeviceCommandResult[]) => void
}
