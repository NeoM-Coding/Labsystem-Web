import { http } from '@/shared/api/http'
import type {
  ApiResponse,
  Device,
  DeviceTelemetrySnapshot,
  Gateway,
} from '../types'

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.ok) throw new Error(response.msg || '设备数据请求失败')
  return response.data
}

function laboratoryParams(laboratoryIds: string[]) {
  const params = new URLSearchParams()
  laboratoryIds.forEach((id) => params.append('laboratoryIds', id))
  return params
}

export async function getDevices(laboratoryIds: string[], signal?: AbortSignal) {
  const { data } = await http.get<ApiResponse<Device[]>>('/mqtt/devices', {
    params: laboratoryParams(laboratoryIds),
    signal,
  })
  return unwrap(data)
}

export async function getGateways(laboratoryIds: string[], signal?: AbortSignal) {
  const { data } = await http.get<ApiResponse<Gateway[]>>('/mqtt/gateways', {
    params: laboratoryParams(laboratoryIds),
    signal,
  })
  return unwrap(data)
}

export async function getTelemetrySnapshots(laboratoryIds: string[], signal?: AbortSignal) {
  const { data } = await http.get<ApiResponse<DeviceTelemetrySnapshot[]>>(
    '/mqtt/devices/telemetry-snapshots',
    { params: laboratoryParams(laboratoryIds), signal },
  )
  return unwrap(data)
}
