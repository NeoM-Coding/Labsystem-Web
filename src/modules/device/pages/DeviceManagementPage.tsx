import { DeviceManagement } from '../components/DeviceManagement'
import { deviceManagementDataSource } from '../api/deviceManagement'
import { LaboratoryFilterBar } from '@/modules/laboratory/components/LaboratoryFilterBar'
import { useLaboratoryFilterStore } from '@/modules/laboratory/store/laboratoryFilterStore'

export default function DeviceManagementPage() {
  const laboratoryIds = useLaboratoryFilterStore((state) => state.laboratoryIds)
  return (
    <div>
      <div className="mb-5 flex items-end justify-between gap-4 max-sm:flex-col max-sm:items-start">
        <div>
          <p className="mb-2 text-xs font-extrabold tracking-[.12em] text-[#18825c]">DEVICE MANAGEMENT</p>
          <h1 className="m-0 text-3xl font-bold tracking-[-.025em]">设备管理</h1>
        </div>
        <p className="m-0 text-sm text-[#708079]">维护设备配置与网关接入</p>
      </div>
      <LaboratoryFilterBar embedded queryScope="device-management" />
      <div className="mt-5">
        <DeviceManagement dataSource={deviceManagementDataSource} laboratoryIds={laboratoryIds} />
      </div>
    </div>
  )
}
