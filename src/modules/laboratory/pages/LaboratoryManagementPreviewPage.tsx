import { useEffect } from 'react'
import { LaboratoryManagement } from '../components/LaboratoryManagement'
import { useLaboratoryStore } from '../store/laboratoryStore'
import type { Laboratory } from '../types'

const previewLaboratories: Laboratory[] = [
  {
    id: 'lab-preview-201',
    buildingName: '创新楼',
    orgName: '计算机学院',
    laboratoryName: '16-201 智能实验室',
    extra: { capacity: 40 },
    managers: [{ id: 'contact-1', name: '张老师', phone: '13800000000' }],
    createAt: '2026-07-01T08:00:00Z',
    updateAt: '2026-07-24T08:00:00Z',
  },
  {
    id: 'lab-preview-305',
    buildingName: '工程楼',
    orgName: '自动化学院',
    laboratoryName: '设备联合实验室',
    extra: null,
    managers: [],
    createAt: '2026-07-01T08:00:00Z',
    updateAt: '2026-07-24T08:00:00Z',
  },
]

export default function LaboratoryManagementPreviewPage() {
  const count = useLaboratoryStore((state) => Object.keys(state.laboratoriesById).length)
  const hydrate = useLaboratoryStore((state) => state.hydratePreview)

  useEffect(() => {
    hydrate(previewLaboratories)
  }, [hydrate])

  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">COMPONENT PREVIEW</p>
          <h1>实验室管理组件</h1>
        </div>
        <p>当前本地数据：{count} 间实验室</p>
      </div>
      <LaboratoryManagement preview />
    </div>
  )
}
