import { describe, expect, it, vi } from 'vitest'
import { createDeviceManagementPreviewDataSource } from './deviceManagementPreviewData'

describe('device management preview data source', () => {
  it('supports device CRUD and polling changes', async () => {
    const onEvent = vi.fn()
    const source = createDeviceManagementPreviewDataSource(onEvent)
    const created = await source.createDevice({
      deviceName: '新门禁',
      belongTo: 'lab-101',
      deviceType: 'Access',
      polling: false,
      gatewayId: 'gateway-01',
      address: 1,
    })

    await source.setPolling(created.id, true)
    expect((await source.listDevices()).find((device) => device.id === created.id)?.polling)
      .toBe(true)

    await source.updateDevice(created.id, {
      deviceName: '更新后的门禁',
      belongTo: created.belongTo,
      deviceType: created.deviceType,
      polling: created.polling,
      gatewayId: created.gatewayId,
      address: created.address,
    })
    expect((await source.listDevices()).find((device) => device.id === created.id)?.deviceName)
      .toBe('更新后的门禁')

    await source.deleteDevice(created.id)
    expect((await source.listDevices()).some((device) => device.id === created.id)).toBe(false)
    expect(onEvent).toHaveBeenCalled()
  })

  it('prevents deleting a gateway that still owns devices', async () => {
    const source = createDeviceManagementPreviewDataSource(vi.fn())

    await expect(source.deleteGateway('gateway-01'))
      .rejects.toThrow('该网关仍有关联设备')
  })
})
