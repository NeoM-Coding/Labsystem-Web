import { beforeEach, describe, expect, it } from 'vitest'
import type { Laboratory } from '../types'
import { useLaboratoryFilterStore } from './laboratoryFilterStore'

const laboratories: Laboratory[] = [
  ['lab-101', '创新楼', '计算机学院', '智能系统实验室'],
  ['lab-102', '创新楼', '自动化学院', '机器人实验室'],
  ['lab-201', '工程训练中心', '计算机学院', '网络空间实验室'],
].map(([id, buildingName, orgName, laboratoryName]) => ({
  id,
  buildingName,
  orgName,
  laboratoryName,
  extra: null,
  managers: [],
  createAt: '2026-01-01T08:00:00',
  updateAt: '2026-01-01T08:00:00',
}))

describe('laboratoryFilterStore', () => {
  beforeEach(() => {
    useLaboratoryFilterStore.setState({
      buildingNames: [],
      orgNames: [],
      matchedLaboratories: [],
      laboratoryIds: [],
      isResolving: true,
    })
  })

  it('selects every laboratory when the unfiltered resolution arrives', () => {
    useLaboratoryFilterStore.getState().setResolution(laboratories, false)

    expect(useLaboratoryFilterStore.getState().laboratoryIds).toEqual([
      'lab-101',
      'lab-102',
      'lab-201',
    ])
  })

  it('can resolve laboratories without selecting them for explicit-scope pages', () => {
    useLaboratoryFilterStore.getState().setResolution(laboratories, false, false)

    expect(useLaboratoryFilterStore.getState().matchedLaboratories).toEqual(laboratories)
    expect(useLaboratoryFilterStore.getState().laboratoryIds).toEqual([])
  })

  it('replaces the selectable scope when building or organization filters change', () => {
    useLaboratoryFilterStore.getState().setBuildingNames(['创新楼'])
    useLaboratoryFilterStore.getState().setOrgNames(['计算机学院'])
    useLaboratoryFilterStore.getState().setResolution([laboratories[0]], false)

    expect(useLaboratoryFilterStore.getState().matchedLaboratories).toEqual([laboratories[0]])
    expect(useLaboratoryFilterStore.getState().laboratoryIds).toEqual(['lab-101'])
  })

  it('accepts only laboratory ids from the current matched scope', () => {
    useLaboratoryFilterStore.getState().setResolution(laboratories, false)
    useLaboratoryFilterStore.getState().setLaboratoryIds(['lab-102', 'missing'])

    expect(useLaboratoryFilterStore.getState().laboratoryIds).toEqual(['lab-102'])
  })
})
