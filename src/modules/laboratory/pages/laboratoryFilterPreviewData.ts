import type { LaboratoryFilterDataSource } from '../components/LaboratoryFilterBar'
import type { Laboratory, OptionPair } from '../types'

const mockLaboratories: Laboratory[] = [
  {
    id: 'lab-101',
    buildingName: '创新楼',
    orgName: '计算机学院',
    laboratoryName: '智能系统实验室',
    extra: null,
    managers: [],
    createAt: '2026-01-01T08:00:00',
    updateAt: '2026-01-01T08:00:00',
  },
  {
    id: 'lab-102',
    buildingName: '创新楼',
    orgName: '自动化学院',
    laboratoryName: '机器人实验室',
    extra: null,
    managers: [],
    createAt: '2026-01-01T08:00:00',
    updateAt: '2026-01-01T08:00:00',
  },
  {
    id: 'lab-201',
    buildingName: '工程训练中心',
    orgName: '计算机学院',
    laboratoryName: '网络空间实验室',
    extra: null,
    managers: [],
    createAt: '2026-01-01T08:00:00',
    updateAt: '2026-01-01T08:00:00',
  },
]

function optionsFrom(field: 'buildingName' | 'orgName'): OptionPair[] {
  return mockLaboratories.map((laboratory) => ({
    f: laboratory.id,
    s: laboratory[field] ?? '',
  }))
}

export const laboratoryFilterPreviewDataSource: LaboratoryFilterDataSource = {
  getBuildingOptions: async () => optionsFrom('buildingName'),
  getOrganizationOptions: async () => optionsFrom('orgName'),
  getLaboratories: async (buildingNames, orgNames) => mockLaboratories.filter((laboratory) => (
    (buildingNames.length === 0 || buildingNames.includes(laboratory.buildingName))
    && (orgNames.length === 0 || orgNames.includes(laboratory.orgName ?? ''))
  )),
}
