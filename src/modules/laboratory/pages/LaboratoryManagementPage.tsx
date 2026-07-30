import { LaboratoryManagement } from '../components/LaboratoryManagement'

export default function LaboratoryManagementPage() {
  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">LABORATORY</p>
          <h1>实验室管理</h1>
        </div>
        <p>维护实验室资料、负责人和扩展配置</p>
      </div>
      <LaboratoryManagement
        extraColumns={[
          {
            key: 'area',
            label: '面积',
            render: (value) => typeof value === 'number' ? `${value} m²` : '—',
            input: {
              type: 'number',
              unit: 'm²',
              min: 0,
              step: 0.1,
              placeholder: '例如 120',
            },
          },
          {
            key: 'level',
            label: '安全等级',
            render: (value) => typeof value === 'number' ? `${value} 级` : '—',
            input: {
              type: 'select',
              placeholder: '请选择安全等级',
              options: [1, 2, 3, 4, 5].map((level) => ({
                label: `${level} 级`,
                value: level,
              })),
            },
          },
        ]} />
    </div>
  )
}
