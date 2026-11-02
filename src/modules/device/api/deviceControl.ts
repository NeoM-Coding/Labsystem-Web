import { http } from '@/shared/api/http'
import type { ApiResponse } from '../types'
import type {
  DeviceCommandResult,
  DeviceControlDataSource,
  MqttResponse,
} from '../control/types'

function unwrap<T>(response: ApiResponse<T>) {
  return response.data
}

export const deviceControlDataSource: DeviceControlDataSource = {
  single: async (request) => {
    const { data } = await http.post<ApiResponse<MqttResponse>>('/mqtt/tasks', request, { timeout: 15_000 })
    return {
      deviceId: request.deviceId,
      success: true,
      code: 200,
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
