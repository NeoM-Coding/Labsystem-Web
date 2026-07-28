import { useEffect } from 'react'
import { useDeviceStore } from '@/modules/device/store/deviceStore'
import {
  createPreviewSnapshots,
  previewDevices,
  previewGateways,
} from '@/modules/device/pages/devicePreviewData'
import { StrategyManagement } from '../components/StrategyManagement'
import { useStrategyStore } from '../store/strategyStore'
import type { RuntimeRevision } from '../types'

const previewStrategies: RuntimeRevision[] = [{
  runtimeId: 'night-air-condition-guard',
  enabled: true,
  activeFrom: null,
  activeUntil: null,
  deviceConditionGroups: [{
    groupId: 'room-temperature',
    conditions: [{
      conditionId: 'temperature-high',
      deviceType: 'AirCondition',
      deviceId: 'dev-air-01',
      field: 'roomTemperature',
      operator: 'GE',
      value: '28',
      logicToPrevious: 'AND',
    }],
  }],
  timeConditionGroups: [{
    groupId: 'night-window',
    conditions: [{
      conditionId: 'workday-night',
      type: 'WINDOW',
      startDate: null,
      endDate: null,
      weekdays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      zoneId: 'Asia/Shanghai',
      startTime: '18:00:00',
      endTime: '23:00:00',
      timePoint: null,
    }],
  }],
  actionGroups: [{
    actionGroupId: 'cooling-action',
    deviceConditionGroupId: 'room-temperature',
    timeConditionGroupId: 'night-window',
    actions: [{
      type: 'Control',
      control: {
        commandLine: 'OPEN_AIR_CONDITION_RS485',
        args: [],
        type: 'AirCondition',
        deviceId: 'dev-air-01',
      },
      userIds: [],
      reportTypes: [],
      content: null,
    }],
  }],
}]

export default function StrategyManagementPreviewPage() {
  const hydrate = useStrategyStore((state) => state.hydratePreview)
  useEffect(() => {
    hydrate(previewStrategies)
    useDeviceStore.getState().hydratePreview(
      previewDevices,
      previewGateways,
      createPreviewSnapshots(),
    )
  }, [hydrate])
  return (
    <div>
      <div className="page-heading">
        <div><p className="eyebrow">COMPONENT PREVIEW</p><h1>智能策略组件</h1></div>
        <p>Revision 编辑、启停和删除均只修改本地预览状态</p>
      </div>
      <StrategyManagement preview />
    </div>
  )
}
