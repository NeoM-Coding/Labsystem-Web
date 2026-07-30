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
    extra: {
      capacity: 40,
      safetyLevel: '重点实验室',
      facilities: { workstationCount: 36 },
    },
    managers: [{
      id: 'contact-1',
      name: '张老师',
      username: 'zhang',
      phone: '13800000000',
      email: 'zhang@example.edu.cn',
      mark: '实验室安全负责人',
    }],
    createAt: '2026-07-01T08:00:00Z',
    updateAt: '2026-07-24T08:00:00Z',
  },
  {
    id: 'lab-preview-305',
    buildingName: '工程楼',
    orgName: '自动化学院',
    laboratoryName: '设备联合实验室',
    extra: {
      capacity: 24,
      safetyLevel: '普通实验室',
      facilities: { workstationCount: 20 },
    },
    managers: [{ id: 'contact-2', name: '李教授', email: 'li@example.edu.cn' }],
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
        <p>当前本地数据：{count} 间实验室 · 已启用 3 个 extra 扩展列</p>
      </div>
      <LaboratoryManagement
        preview
        extraColumns={[
          {
            key: 'capacity',
            label: '容纳人数',
            render: (value) => typeof value === 'number' ? `${value} 人` : '—',
            input: {
              type: 'number',
              unit: '人',
              min: 1,
              max: 500,
              placeholder: '例如 40',
            },
          },
          {
            key: 'safetyLevel',
            label: '安全等级',
            input: {
              type: 'select',
              placeholder: '请选择实验室等级',
              options: [
                { label: '普通实验室', value: '普通实验室' },
                { label: '重点实验室', value: '重点实验室' },
              ],
            },
          },
          {
            key: 'facilities.workstationCount',
            label: '工位',
            render: (value) => typeof value === 'number' ? `${value} 个` : '—',
            input: {
              type: 'number',
              unit: '个',
              min: 0,
              max: 500,
              placeholder: '例如 36',
            },
          },
        ]}
      />
    </div>
  )
}
