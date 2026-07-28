import type { CommandLine } from '@/modules/device/control/types'
import type { DeviceType } from '@/modules/device/types'

export type LogicType = 'AND' | 'OR'
export type StrategyOperator = 'EQ' | 'NE' | 'GT' | 'GE' | 'ST' | 'SE'
export type TimeConditionType = 'WINDOW' | 'TIME_POINT'
export type ReportType = 'SMS' | 'SMTP'

export interface DeviceCondition {
  conditionId: string
  deviceType: DeviceType
  deviceId: string
  field: string
  operator: StrategyOperator
  value: string
  logicToPrevious: LogicType
}

export interface DeviceConditionGroup {
  groupId: string
  conditions: DeviceCondition[]
}

export interface TimeCondition {
  conditionId: string
  type: TimeConditionType
  startDate: string | null
  endDate: string | null
  weekdays: string[]
  zoneId: string
  startTime: string | null
  endTime: string | null
  timePoint: string | null
}

export interface TimeConditionGroup {
  groupId: string
  conditions: TimeCondition[]
}

export interface ControlAction {
  type: 'Control'
  control: {
    commandLine: CommandLine
    args: number[]
    type: DeviceType
    deviceId: string
  }
  userIds: string[]
  reportTypes: string[]
  content: string | null
}

export interface ReportAction {
  type: 'Report'
  control: null
  userIds: string[]
  reportTypes: ReportType[]
  content: string
}

export type StrategyAction = ControlAction | ReportAction

export interface ActionGroup {
  actionGroupId: string
  deviceConditionGroupId: string
  timeConditionGroupId: string
  actions: StrategyAction[]
}

export interface RuntimeRevision {
  runtimeId: string
  enabled: boolean
  activeFrom: string | null
  activeUntil: string | null
  deviceConditionGroups: DeviceConditionGroup[]
  timeConditionGroups: TimeConditionGroup[]
  actionGroups: ActionGroup[]
}
