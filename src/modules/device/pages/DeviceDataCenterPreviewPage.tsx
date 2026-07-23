import { useEffect } from 'react'
import { DeviceDataCenter } from '../components/DeviceDataCenter'
import { useDeviceStore } from '../store/deviceStore'
import { createPreviewSnapshots, previewDevices, previewGateways } from './devicePreviewData'
import { createPreviewControlDataSource } from './deviceControlPreviewData'

export default function DeviceDataCenterPreviewPage() {
  useEffect(() => {
    const store = useDeviceStore.getState()
    store.hydratePreview(previewDevices, previewGateways, createPreviewSnapshots())
    let sequence = 0
    const timer = window.setInterval(() => {
      sequence += 1
      const now = new Date().toISOString()
      useDeviceStore.getState().applyRealtimeEvent({
        version: '1.0',
        eventId: `preview-${sequence}`,
        eventType: 'device.telemetry.updated',
        occurredAt: now,
        source: 'preview',
        traceId: null,
        resource: { type: 'device', id: 'dev-sensor-01', laboratoryId: 'lab-102' },
        data: {
          deviceType: 'Sensor',
          temperature: Number((23.4 + (sequence % 5) * 0.1).toFixed(1)),
          humidity: 48 + sequence % 3,
          co2: 610 + sequence * 2,
        },
      })
      useDeviceStore.getState().tick()
    }, 2_000)
    return () => {
      window.clearInterval(timer)
      useDeviceStore.getState().reset()
    }
  }, [])

  return (
    <div>
      <div className="mb-7 flex items-end justify-between gap-4 max-sm:flex-col max-sm:items-start">
        <div>
          <p className="mb-2 text-xs font-extrabold tracking-[.12em] text-[#18825c]">COMPONENT PREVIEW</p>
          <h1 className="m-0 text-3xl font-bold tracking-[-.025em]">设备数据中心</h1>
        </div>
        <p className="m-0 text-sm text-[#708079]">本地模拟数据每 2 秒更新，可切换视图并打开详情</p>
      </div>
      <DeviceDataCenter controlDataSource={createPreviewControlDataSource()} />
    </div>
  )
}
