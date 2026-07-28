import { createStore, type StoreApi } from 'zustand/vanilla'
import { commandArgsAreValid, commandsFor } from '@/modules/device/control/commandCatalog'
import { deviceField, strategyOperatorOptions } from '@/modules/device/deviceFieldCatalog'
import type { DeviceType } from '@/modules/device/types'
import type {
  ActionGroup,
  DeviceCondition,
  DeviceConditionGroup,
  RuntimeRevision,
  StrategyAction,
  TimeCondition,
  TimeConditionGroup,
} from '../types'

let generatedId = 0

function id(prefix: string) {
  generatedId += 1
  const random = globalThis.crypto?.randomUUID?.()
  return `${prefix}-${random ?? generatedId}`
}

export type DraftAction = StrategyAction & { _key: string }
export type DraftActionGroup = Omit<ActionGroup, 'actions'> & { actions: DraftAction[] }
export type StrategyDraft = Omit<RuntimeRevision, 'actionGroups'> & {
  actionGroups: DraftActionGroup[]
}

export interface StrategyValidationIssue {
  path: string
  message: string
}

export interface StrategyDraftState {
  draft: StrategyDraft
  dirty: boolean
  update: (recipe: (draft: StrategyDraft) => void) => void
  replace: (revision: RuntimeRevision | null) => void
  markClean: () => void
}

export type StrategyDraftStore = StoreApi<StrategyDraftState>

function clone<T>(value: T): T {
  return structuredClone(value)
}

function withKeys(revision: RuntimeRevision): StrategyDraft {
  return {
    ...clone(revision),
    actionGroups: revision.actionGroups.map((group) => ({
      ...group,
      actions: group.actions.map((action) => ({ ...action, _key: id('action') })),
    })),
  }
}

export function createEmptyDeviceCondition(deviceType: DeviceType = 'AirCondition'): DeviceCondition {
  return {
    conditionId: id('device-condition'),
    deviceType,
    deviceId: '',
    field: '',
    operator: 'EQ',
    value: '',
    logicToPrevious: 'AND',
  }
}

export function createEmptyTimeCondition(defaultZoneId = 'Asia/Shanghai'): TimeCondition {
  return {
    conditionId: id('time-condition'),
    type: 'WINDOW',
    startDate: null,
    endDate: null,
    weekdays: [],
    zoneId: defaultZoneId,
    startTime: '08:00:00',
    endTime: '18:00:00',
    timePoint: null,
  }
}

export function createEmptyControlAction(deviceType: DeviceType = 'AirCondition'): DraftAction {
  const command = commandsFor(deviceType)[0]
  return {
    _key: id('action'),
    type: 'Control',
    control: {
      commandLine: command.commandLine,
      args: [],
      type: deviceType,
      deviceId: '',
    },
    userIds: [],
    reportTypes: [],
    content: null,
  }
}

export function createStrategyDraft(revision: RuntimeRevision | null): StrategyDraft {
  if (revision) return withKeys(revision)
  const deviceGroup: DeviceConditionGroup = { groupId: '始终满足', conditions: [] }
  const timeGroup: TimeConditionGroup = { groupId: '始终满足', conditions: [] }
  return {
    runtimeId: '',
    enabled: false,
    activeFrom: null,
    activeUntil: null,
    deviceConditionGroups: [deviceGroup],
    timeConditionGroups: [timeGroup],
    actionGroups: [{
      actionGroupId: '执行动作 1',
      deviceConditionGroupId: deviceGroup.groupId,
      timeConditionGroupId: timeGroup.groupId,
      actions: [],
    }],
  }
}

export function createStrategyDraftStore(
  revision: RuntimeRevision | null,
): StrategyDraftStore {
  return createStore<StrategyDraftState>((set) => ({
    draft: createStrategyDraft(revision),
    dirty: false,
    update: (recipe) => set((state) => {
      const draft = clone(state.draft)
      recipe(draft)
      return { draft, dirty: true }
    }),
    replace: (nextRevision) => set({
      draft: createStrategyDraft(nextRevision),
      dirty: false,
    }),
    markClean: () => set({ dirty: false }),
  }))
}

export function renameDeviceConditionGroup(
  draft: StrategyDraft,
  previousId: string,
  nextId: string,
) {
  const group = draft.deviceConditionGroups.find((item) => item.groupId === previousId)
  if (!group) return
  group.groupId = nextId
  draft.actionGroups.forEach((actionGroup) => {
    if (actionGroup.deviceConditionGroupId === previousId) {
      actionGroup.deviceConditionGroupId = nextId
    }
  })
}

export function renameTimeConditionGroup(
  draft: StrategyDraft,
  previousId: string,
  nextId: string,
) {
  const group = draft.timeConditionGroups.find((item) => item.groupId === previousId)
  if (!group) return
  group.groupId = nextId
  draft.actionGroups.forEach((actionGroup) => {
    if (actionGroup.timeConditionGroupId === previousId) {
      actionGroup.timeConditionGroupId = nextId
    }
  })
}

export function deviceGroupReferences(draft: StrategyDraft, groupId: string) {
  return draft.actionGroups
    .filter((group) => group.deviceConditionGroupId === groupId)
    .map((group) => group.actionGroupId)
}

export function timeGroupReferences(draft: StrategyDraft, groupId: string) {
  return draft.actionGroups
    .filter((group) => group.timeConditionGroupId === groupId)
    .map((group) => group.actionGroupId)
}

function duplicate(values: string[]) {
  const blank = values.find((value) => !value.trim())
  if (blank !== undefined) return blank
  const seen = new Set<string>()
  return values.find((value) => seen.has(value) || !seen.add(value))
}

function isValidZone(zoneId: string) {
  try {
    new Intl.DateTimeFormat('zh-CN', { timeZone: zoneId }).format()
    return true
  } catch {
    return false
  }
}

function validateCondition(
  condition: DeviceCondition,
  path: string,
  issues: StrategyValidationIssue[],
) {
  if (!condition.deviceId.trim()) issues.push({ path, message: '请选择设备' })
  const field = deviceField(condition.deviceType, condition.field)
  if (!field) {
    issues.push({ path, message: '请选择有效的设备属性' })
    return
  }
  const operators = strategyOperatorOptions[field.kind].map((item) => item.value)
  if (!(operators as readonly string[]).includes(condition.operator)) {
    issues.push({ path, message: '当前属性不支持所选比较方式' })
  }
  if (condition.value.trim() === '') {
    issues.push({ path, message: '请设置条件值' })
  } else if (field.kind === 'number' && !Number.isFinite(Number(condition.value))) {
    issues.push({ path, message: '条件值必须是有效数字' })
  } else if (field.options && !field.options.some((option) => option.value === condition.value)) {
    issues.push({ path, message: '条件值不在可选范围内' })
  }
}

export function validateStrategyDraft(draft: StrategyDraft): StrategyValidationIssue[] {
  const issues: StrategyValidationIssue[] = []
  if (!draft.runtimeId.trim()) issues.push({ path: 'basic', message: '请输入策略标识' })
  if (draft.activeFrom && draft.activeUntil
    && Date.parse(draft.activeFrom) >= Date.parse(draft.activeUntil)) {
    issues.push({ path: 'basic', message: '结束时间必须晚于开始时间' })
  }

  const duplicateDeviceGroup = duplicate(draft.deviceConditionGroups.map((group) => group.groupId.trim()))
  if (duplicateDeviceGroup !== undefined) {
    issues.push({ path: 'device-groups', message: duplicateDeviceGroup ? `设备条件组名称重复：${duplicateDeviceGroup}` : '设备条件组名称不能为空' })
  }
  draft.deviceConditionGroups.forEach((group, groupIndex) => {
    const duplicateCondition = duplicate(group.conditions.map((condition) => condition.conditionId))
    if (duplicateCondition !== undefined) {
      issues.push({ path: `device-group-${groupIndex}`, message: '设备条件标识重复' })
    }
    group.conditions.forEach((condition, conditionIndex) => {
      validateCondition(condition, `device-group-${groupIndex}-condition-${conditionIndex}`, issues)
    })
  })

  const duplicateTimeGroup = duplicate(draft.timeConditionGroups.map((group) => group.groupId.trim()))
  if (duplicateTimeGroup !== undefined) {
    issues.push({ path: 'time-groups', message: duplicateTimeGroup ? `时间条件组名称重复：${duplicateTimeGroup}` : '时间条件组名称不能为空' })
  }
  draft.timeConditionGroups.forEach((group, groupIndex) => {
    const duplicateCondition = duplicate(group.conditions.map((condition) => condition.conditionId))
    if (duplicateCondition !== undefined) {
      issues.push({ path: `time-group-${groupIndex}`, message: '时间条件标识重复' })
    }
    group.conditions.forEach((condition, conditionIndex) => {
      const path = `time-group-${groupIndex}-condition-${conditionIndex}`
      if (!isValidZone(condition.zoneId)) issues.push({ path, message: '请选择有效时区' })
      if (condition.startDate && condition.endDate && condition.startDate > condition.endDate) {
        issues.push({ path, message: '结束日期不能早于开始日期' })
      }
      if (condition.type === 'WINDOW') {
        if (!condition.startTime || !condition.endTime) issues.push({ path, message: '请设置完整时间段' })
        else if (condition.startTime === condition.endTime) issues.push({ path, message: '开始和结束时间不能相同' })
      } else if (!condition.timePoint) {
        issues.push({ path, message: '请设置执行时间点' })
      }
    })
  })

  const deviceGroupIds = new Set(draft.deviceConditionGroups.map((group) => group.groupId))
  const timeGroupIds = new Set(draft.timeConditionGroups.map((group) => group.groupId))
  const duplicateActionGroup = duplicate(draft.actionGroups.map((group) => group.actionGroupId.trim()))
  if (duplicateActionGroup !== undefined) {
    issues.push({ path: 'action-groups', message: duplicateActionGroup ? `动作组名称重复：${duplicateActionGroup}` : '动作组名称不能为空' })
  }
  if (draft.actionGroups.length === 0) {
    issues.push({ path: 'action-groups', message: '请至少添加一个动作组' })
  }
  draft.actionGroups.forEach((group, groupIndex) => {
    const path = `action-group-${groupIndex}`
    if (!deviceGroupIds.has(group.deviceConditionGroupId)) issues.push({ path, message: '请选择有效的设备条件组' })
    if (!timeGroupIds.has(group.timeConditionGroupId)) issues.push({ path, message: '请选择有效的时间条件组' })
    if (group.actions.length === 0) issues.push({ path, message: '请至少添加一个控制动作' })
    group.actions.forEach((action, actionIndex) => {
      if (action.type === 'Report') return
      const actionPath = `${path}-action-${actionIndex}`
      if (!action.control.deviceId.trim()) issues.push({ path: actionPath, message: '请选择控制设备' })
      const command = commandsFor(action.control.type)
        .find((item) => item.commandLine === action.control.commandLine)
      if (!command) issues.push({ path: actionPath, message: '指令与设备类型不匹配' })
      else if (!commandArgsAreValid(command, action.control.args)) {
        issues.push({ path: actionPath, message: '指令参数不完整或超出范围' })
      }
    })
  })
  return issues
}

export function serializeStrategyDraft(draft: StrategyDraft): RuntimeRevision {
  return {
    runtimeId: draft.runtimeId.trim(),
    enabled: draft.enabled,
    activeFrom: draft.activeFrom,
    activeUntil: draft.activeUntil,
    deviceConditionGroups: draft.deviceConditionGroups.map((group) => ({
      groupId: group.groupId.trim(),
      conditions: group.conditions.map((condition, index) => ({
        ...condition,
        logicToPrevious: index === 0 ? 'AND' : condition.logicToPrevious,
      })),
    })),
    timeConditionGroups: clone(draft.timeConditionGroups).map((group) => ({
      ...group,
      groupId: group.groupId.trim(),
    })),
    actionGroups: draft.actionGroups.map((group) => ({
      actionGroupId: group.actionGroupId.trim(),
      deviceConditionGroupId: group.deviceConditionGroupId,
      timeConditionGroupId: group.timeConditionGroupId,
      actions: group.actions.map((action) => {
        const serialized = clone(action) as Partial<DraftAction>
        delete serialized._key
        return serialized as StrategyAction
      }),
    })),
  }
}
