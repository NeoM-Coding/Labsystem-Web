import { useMemo, useState } from 'react'
import { DeviceControlDialog } from '../components/DeviceControlDialog'
import type { DeviceCommandResult, DeviceControlRequest } from '../control/types'
import { createPreviewControlDataSource } from './deviceControlPreviewData'
import { previewDevices } from './devicePreviewData'

type CapturedRequest = DeviceControlRequest & {
  deviceId?: string
  deviceIds?: string[]
}

export default function DeviceControlPreviewPage() {
  const [mode, setMode] = useState<'single' | 'multi' | null>(null)
  const [lastRequest, setLastRequest] = useState<CapturedRequest | null>(null)
  const [lastResults, setLastResults] = useState<DeviceCommandResult[]>([])
  const air = previewDevices.find((device) => device.deviceType === 'AirCondition')
  const lights = previewDevices.filter((device) => device.deviceType === 'Light')
  const dataSource = useMemo(() => createPreviewControlDataSource((request, results) => {
    setLastRequest(request)
    setLastResults(results)
  }), [])
  const targets = mode === 'single' ? (air ? [air] : []) : lights

  return (
    <div>
      <div className="mb-7">
        <p className="mb-2 text-xs font-extrabold tracking-[.12em] text-[#18825c]">COMPONENT PREVIEW</p>
        <h1 className="m-0 text-3xl font-bold tracking-[-.025em]">设备控制 Dialog</h1>
        <p className="mt-3 text-sm text-[#708079]">
          使用确定性本地响应；发送时会保留短暂等待，用于检查缓冲圈和锁定状态。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        <button
          type="button"
          onClick={() => setMode('single')}
          className="rounded-2xl border border-[#dce7e2] bg-white p-6 text-left shadow-[0_8px_28px_rgb(17_48_38_/_5%)] transition-[border-color,transform] duration-150 hover:border-[#a9cfbf] active:scale-[.98]"
        >
          <span className="text-xs font-extrabold text-[#18825c]">SINGLE</span>
          <strong className="mt-2 block text-lg">控制一台空调</strong>
          <span className="mt-1 block text-sm text-[#74837c]">可预览 16–30°C 增强控制参数。</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('multi')}
          className="rounded-2xl border border-[#dce7e2] bg-white p-6 text-left shadow-[0_8px_28px_rgb(17_48_38_/_5%)] transition-[border-color,transform] duration-150 hover:border-[#a9cfbf] active:scale-[.98]"
        >
          <span className="text-xs font-extrabold text-[#18825c]">MULTI</span>
          <strong className="mt-2 block text-lg">批量控制两台照明</strong>
          <span className="mt-1 block text-sm text-[#74837c]">用于检查同类型目标和逐台执行结果。</span>
        </button>
      </div>

      <section className="mt-6 rounded-2xl bg-[#173c30] p-5 text-white">
        <h2 className="m-0 text-sm">最近一次组件输出</h2>
        <pre className="mb-0 mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-white/75">
          {lastRequest
            ? JSON.stringify({ request: lastRequest, results: lastResults }, null, 2)
            : '尚未发送指令'}
        </pre>
      </section>

      <DeviceControlDialog
        open={mode !== null}
        targets={targets}
        dataSource={dataSource}
        onClose={() => setMode(null)}
      />
    </div>
  )
}
