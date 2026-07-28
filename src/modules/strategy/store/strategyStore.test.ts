import { beforeEach, describe, expect, it } from 'vitest'
import type { RuntimeRevision } from '../types'
import { useStrategyStore } from './strategyStore'

const revision: RuntimeRevision = {
  runtimeId: 'runtime-test',
  enabled: false,
  activeFrom: null,
  activeUntil: null,
  deviceConditionGroups: [],
  timeConditionGroups: [],
  actionGroups: [],
}

describe('strategyStore preview mutations', () => {
  beforeEach(() => useStrategyStore.getState().reset())

  it('keeps revision status changes local and normalized', () => {
    useStrategyStore.getState().hydratePreview([revision])
    useStrategyStore.getState().upsertLocal({ ...revision, enabled: true })
    expect(useStrategyStore.getState().revisionsById['runtime-test'].enabled).toBe(true)

    useStrategyStore.getState().removeLocal('runtime-test')
    expect(useStrategyStore.getState().revisionsById['runtime-test']).toBeUndefined()
  })
})
