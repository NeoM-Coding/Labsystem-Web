import { useEffect } from 'react'
import { LaboratoryFilterBar } from '@/modules/laboratory/components/LaboratoryFilterBar'
import { useLaboratoryFilterStore } from '@/modules/laboratory/store/laboratoryFilterStore'
import { useDeviceStore } from '@/modules/device/store/deviceStore'
import { StrategyManagement } from '../components/StrategyManagement'

export default function StrategyManagementPage() {
  const laboratoryIds = useLaboratoryFilterStore((state) => state.laboratoryIds)
  const isResolving = useLaboratoryFilterStore((state) => state.isResolving)

  useEffect(() => {
    if (isResolving) return
    void useDeviceStore.getState().refreshScope(laboratoryIds)
  }, [isResolving, laboratoryIds])

  return (
    <div>
      <div className="page-heading">
        <div><p className="eyebrow">AUTOMATION</p><h1>智能策略</h1></div>
        <p>维护设备条件、时间约束、控制与通知动作</p>
      </div>
      <LaboratoryFilterBar embedded queryScope="strategy-management" />
      <div className="mt-5"><StrategyManagement /></div>
    </div>
  )
}
