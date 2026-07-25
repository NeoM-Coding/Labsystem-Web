import axios from 'axios'
import { http } from '@/shared/api/http'
import { getLaboratories } from '@/modules/laboratory/api/laboratories'
import type { Laboratory } from '@/modules/laboratory/types'
import type { ApiResponse, Device, Gateway } from '../types'
import type { DeviceManagementDataSource } from '../components/DeviceManagement'

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.ok) throw new Error(response.msg || '设备管理请求失败')
  return response.data
}

async function request<T>(operation: () => Promise<{ data: ApiResponse<T> }>) {
  try {
    return unwrap((await operation()).data)
  } catch (cause) {
    if (axios.isAxiosError<ApiResponse<unknown>>(cause)) {
      throw new Error(cause.response?.data?.msg || '设备管理请求失败')
    }
    throw cause
  }
}

function laboratoryParams(laboratoryIds: string[]) {
  const params = new URLSearchParams()
  laboratoryIds.forEach((id) => params.append('laboratoryIds', id))
  return params
}

export const deviceManagementDataSource: DeviceManagementDataSource = {
  listDevices: (laboratoryIds = []) => request(() => http.get<ApiResponse<Device[]>>(
    '/mqtt/devices',
    { params: laboratoryParams(laboratoryIds) },
  )),
  listGateways: (laboratoryIds = []) => request(() => http.get<ApiResponse<Gateway[]>>(
    '/mqtt/gateways',
    { params: laboratoryParams(laboratoryIds) },
  )),
  listLaboratories: (): Promise<Laboratory[]> => getLaboratories([], []),
  createDevice: (device) => request(() => http.post<ApiResponse<Device>>('/mqtt/devices', device)),
  updateDevice: (deviceId, device) => request(
    () => http.put<ApiResponse<Device>>(`/mqtt/devices/${deviceId}`, device),
  ),
  deleteDevice: (deviceId) => request(
    () => http.delete<ApiResponse<null>>(`/mqtt/devices/${deviceId}`),
  ).then(() => undefined),
  setPolling: (deviceId, enabled) => request(
    () => enabled
      ? http.put<ApiResponse<unknown>>(`/mqtt/devices/${deviceId}/polling`)
      : http.delete<ApiResponse<unknown>>(`/mqtt/devices/${deviceId}/polling`),
  ).then(() => undefined),
  createGateway: (gateway) => request(
    () => http.post<ApiResponse<Gateway>>('/mqtt/gateways', gateway),
  ),
  updateGateway: (gatewayId, gateway) => request(
    () => http.put<ApiResponse<Gateway>>(`/mqtt/gateways/${gatewayId}`, gateway),
  ),
  deleteGateway: (gatewayId) => request(
    () => http.delete<ApiResponse<null>>(`/mqtt/gateways/${gatewayId}`),
  ).then(() => undefined),
}
