import { describe, expect, it } from 'vitest'
import {
  createEmptyControlAction,
  createEmptyDeviceCondition,
  createEmptyTimeCondition,
  createStrategyDraft,
  deviceGroupReferences,
  renameDeviceConditionGroup,
  renameTimeConditionGroup,
  serializeStrategyDraft,
  timeGroupReferences,
  validateStrategyDraft,
} from './strategyDraftStore'

describe('strategyDraftStore', () => {
  it('creates safe disabled defaults with always groups', () => {
    const draft = createStrategyDraft(null)
    expect(draft.enabled).toBe(false)
    expect(draft.deviceConditionGroups[0].conditions).toEqual([])
    expect(draft.timeConditionGroups[0].conditions).toEqual([])
    expect(draft.actionGroups[0]).toMatchObject({
      deviceConditionGroupId: '始终满足',
      timeConditionGroupId: '始终满足',
    })
  })

  it('renames groups and updates action references atomically', () => {
    const draft = createStrategyDraft(null)
    renameDeviceConditionGroup(draft, '始终满足', '室温过高')
    renameTimeConditionGroup(draft, '始终满足', '工作时间')
    expect(deviceGroupReferences(draft, '室温过高')).toEqual(['执行动作 1'])
    expect(timeGroupReferences(draft, '工作时间')).toEqual(['执行动作 1'])
  })

  it('serializes backend values and strips UI keys', () => {
    const draft = createStrategyDraft(null)
    draft.runtimeId = 'night-rule'
    draft.deviceConditionGroups[0].conditions.push({
      ...createEmptyDeviceCondition('AirCondition'),
      deviceId: 'air-1',
      field: 'mode',
      value: 'Heating',
    })
    draft.timeConditionGroups[0].conditions.push(createEmptyTimeCondition())
    draft.actionGroups[0].actions.push(createEmptyControlAction('AirCondition'))
    const revision = serializeStrategyDraft(draft)
    expect(revision.deviceConditionGroups[0].conditions[0].value).toBe('Heating')
    expect(revision.actionGroups[0].actions[0]).not.toHaveProperty('_key')
  })

  it('validates cross-midnight windows but rejects equal times', () => {
    const draft = createStrategyDraft(null)
    draft.runtimeId = 'night-rule'
    const time = createEmptyTimeCondition()
    time.startTime = '22:00:00'
    time.endTime = '06:00:00'
    draft.timeConditionGroups[0].conditions.push(time)
    const action = createEmptyControlAction('AirCondition')
    if (action.type !== 'Control') throw new Error('expected control action')
    draft.actionGroups[0].actions.push({
      ...action,
      control: {
        ...action.control,
        deviceId: 'air-1',
      },
    })
    expect(validateStrategyDraft(draft).some((issue) => issue.message.includes('开始和结束'))).toBe(false)
    time.endTime = '22:00:00'
    expect(validateStrategyDraft(draft).some((issue) => issue.message.includes('开始和结束'))).toBe(true)
  })
})
