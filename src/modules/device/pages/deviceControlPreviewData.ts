import type {
  DeviceCommandResult,
  DeviceControlDataSource,
  DeviceControlRequest,
} from '../control/types'

type PreviewRequest = DeviceControlRequest & {
  deviceId?: string
  deviceIds?: string[]
}

const wait = (milliseconds: number) => new Promise((resolve) => {
  window.setTimeout(resolve, milliseconds)
})

function result(deviceId: string): DeviceCommandResult {
  return {
    deviceId,
    success: true,
    response: { gatewayId: 'preview-gateway', payload: [41, 3, 2, 0, 0, 0, 46] },
    message: '模拟设备已响应',
  }
}

export function createPreviewControlDataSource(
  onRequest?: (request: PreviewRequest, results: DeviceCommandResult[]) => void,
): DeviceControlDataSource {
  return {
    single: async (request) => {
      await wait(850)
      const results = [result(request.deviceId)]
      onRequest?.(request, results)
      return results[0]
    },
    multi: async (request) => {
      await wait(1_100)
      const results = request.deviceIds.map(result)
      onRequest?.(request, results)
      return results
    },
  }
}
