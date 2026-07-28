import { beforeEach, describe, expect, it } from 'vitest'
import { isTelemetryOnline, selectVisibleDevices, useDeviceStore } from './deviceStore'
import { createPreviewSnapshots, previewDevices, previewGateways } from '../pages/devicePreviewData'

describe('deviceStore', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useDeviceStore.getState().reset()
    useDeviceStore.getState().hydratePreview(
      previewDevices,
      previewGateways,
      createPreviewSnapshots(Date.parse('2026-07-23T08:00:00.000Z')),
    )
    useDeviceStore.getState().tick(Date.parse('2026-07-23T08:00:10.000Z'))
  })

  it('filters normalized devices by type and search text', () => {
    useDeviceStore.getState().setDeviceTypeFilter('Sensor')
    useDeviceStore.getState().setSearch('环境')

    const visible = selectVisibleDevices(useDeviceStore.getState())

    expect(visible.map((device) => device.id)).toEqual(['dev-sensor-01'])
  })

  it('ignores older telemetry so websocket data cannot move backwards', () => {
    const before = useDeviceStore.getState().telemetryByDeviceId['dev-sensor-01']
    useDeviceStore.getState().applyRealtimeEvent({
      version: '1.0',
      eventId: 'older-event',
      eventType: 'device.telemetry.updated',
      occurredAt: '2026-07-23T07:58:00.000Z',
      source: 'test',
      traceId: null,
      resource: { type: 'device', id: 'dev-sensor-01', laboratoryId: 'lab-102' },
      data: { deviceType: 'Sensor', temperature: 99 },
    })

    expect(useDeviceStore.getState().telemetryByDeviceId['dev-sensor-01']).toEqual(before)
  })

  it('uses the explicit offline signal and the one-minute freshness window', () => {
    const telemetry = useDeviceStore.getState().telemetryByDeviceId['dev-sensor-01']
    expect(isTelemetryOnline(telemetry, Date.parse('2026-07-23T08:00:10.000Z'))).toBe(true)
    expect(isTelemetryOnline(telemetry, Date.parse('2026-07-23T08:01:10.000Z'))).toBe(false)

    useDeviceStore.getState().applyRealtimeEvent({
      version: '1.0',
      eventId: 'offline-event',
      eventType: 'device.online.changed',
      occurredAt: '2026-07-23T08:00:11.000Z',
      source: 'test',
      traceId: null,
      resource: { type: 'device', id: 'dev-sensor-01', laboratoryId: 'lab-102' },
      data: { online: false },
    })

    expect(isTelemetryOnline(
      useDeviceStore.getState().telemetryByDeviceId['dev-sensor-01'],
      Date.parse('2026-07-23T08:00:12.000Z'),
    )).toBe(false)
  })

  it('applies management mutations without reloading the active scope', () => {
    const device = previewDevices[0]
    useDeviceStore.getState().setDevicePolling(device.id, !device.polling)
    expect(useDeviceStore.getState().devicesById[device.id].polling).toBe(!device.polling)

    useDeviceStore.getState().upsertDevice({ ...device, deviceName: '局部更新设备' })
    expect(useDeviceStore.getState().devicesById[device.id].deviceName).toBe('局部更新设备')

    useDeviceStore.getState().removeDevice(device.id)
    expect(useDeviceStore.getState().devicesById[device.id]).toBeUndefined()
    expect(useDeviceStore.getState().telemetryByDeviceId[device.id]).toBeUndefined()
  })
})
