import { useMemo, useState } from 'react'
import { DeviceManagement } from '../components/DeviceManagement'
import { createDeviceManagementPreviewDataSource } from './deviceManagementPreviewData'
import { LaboratoryFilterBar } from '@/modules/laboratory/components/LaboratoryFilterBar'
import { laboratoryFilterPreviewDataSource } from '@/modules/laboratory/pages/laboratoryFilterPreviewData'
import { useLaboratoryFilterStore } from '@/modules/laboratory/store/laboratoryFilterStore'

export default function DeviceManagementPreviewPage() {
  const [events, setEvents] = useState<string[]>([])
  const laboratoryIds = useLaboratoryFilterStore((state) => state.laboratoryIds)
  const dataSource = useMemo(
    () => createDeviceManagementPreviewDataSource(
      (message) => setEvents((current) => [message, ...current].slice(0, 5)),
    ),
    [],
  )

  return (
    <div>
      <div className="mb-5">
        <p className="mb-2 text-xs font-extrabold tracking-[.12em] text-[#18825c]">COMPONENT PREVIEW</p>
        <h1 className="m-0 text-3xl font-bold tracking-[-.025em]">设备管理</h1>
        <p className="mt-2 mb-0 text-sm text-[#708079]">使用确定性本地数据，可完整体验设备与网关 CRUD。</p>
      </div>
      <LaboratoryFilterBar
        embedded
        dataSource={laboratoryFilterPreviewDataSource}
        queryScope="device-management-preview"
      />
      <div className="mt-5">
        <DeviceManagement dataSource={dataSource} laboratoryIds={laboratoryIds} />
      </div>
      <aside className="mt-5 rounded-2xl border border-[#dce6e1] bg-white p-4 text-xs text-[#61736b]">
        <strong className="text-[#263a32]">最近组件事件</strong>
        <p className="mt-2 mb-0">{events.length ? events.join(' · ') : '尚未执行创建、修改或删除操作'}</p>
      </aside>
    </div>
  )
}
