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
            render: (value) => `${value} m²`,
          },
          {
            key: 'level',
            label: '安全等级',
            render: (value) => `${value} 级`,
          }
        ]} />
    </div>
  )
}
