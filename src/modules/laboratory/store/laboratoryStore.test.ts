import { beforeEach, describe, expect, it } from 'vitest'
import { useLaboratoryStore } from './laboratoryStore'

const laboratory = {
  id: 'lab-1',
  buildingName: '创新楼',
  orgName: '计算机学院',
  laboratoryName: '智能实验室',
  extra: null,
  managers: [],
  createAt: '2026-07-01T08:00:00Z',
  updateAt: '2026-07-01T08:00:00Z',
}

describe('laboratoryStore preview mutations', () => {
  beforeEach(() => useLaboratoryStore.getState().reset())

  it('hydrates, updates and removes normalized laboratories locally', () => {
    useLaboratoryStore.getState().hydratePreview([laboratory])
    useLaboratoryStore.getState().upsertLocal({
      ...laboratory,
      laboratoryName: '更新后的实验室',
    })
    expect(useLaboratoryStore.getState().laboratoriesById['lab-1'].laboratoryName)
      .toBe('更新后的实验室')

    useLaboratoryStore.getState().removeLocal('lab-1')
    expect(useLaboratoryStore.getState().laboratoriesById['lab-1']).toBeUndefined()
  })
})
