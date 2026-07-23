import { http } from '@/shared/api/http'
import type { ApiResponse } from '../types'
import type {
  DeviceCommandResult,
  DeviceControlDataSource,
  MqttResponse,
} from '../control/types'

function unwrap<T>(response: ApiResponse<T>) {
  if (!response.ok) throw new Error(response.msg || '设备指令发送失败')
  return response.data
}

export const deviceControlDataSource: DeviceControlDataSource = {
  single: async (request) => {
    const { data } = await http.post<ApiResponse<MqttResponse>>('/mqtt/tasks', request)
    return {
      deviceId: request.deviceId,
      success: true,
      response: unwrap(data),
      message: '指令执行成功',
    }
  },
  multi: async (request) => {
    const { data } = await http.post<ApiResponse<DeviceCommandResult[]>>(
      '/mqtt/tasks/multi',
      request,
      { timeout: 125_000 },
    )
    return unwrap(data)
  },
}
