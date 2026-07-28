import { AccountManagement } from '../components/AccountManagement'
import type { AccountManagementDataSource } from '../components/AccountManagement'
import type { ManagedUser } from '../types'

let sequence = 1
const previewDataSource: AccountManagementDataSource = {
  listLaboratories: async () => [{
    id: 'lab-preview-1',
    buildingName: '创新楼',
    orgName: '计算机学院',
    laboratoryName: '16-201',
    extra: null,
    managers: [],
    createAt: '2026-07-01T08:00:00Z',
    updateAt: '2026-07-01T08:00:00Z',
  }],
  createUser: async (draft) => ({ id: `preview-user-${sequence++}`, ...draft, password: '' }),
  updateUser: async (userId, draft) => ({ id: userId, name: draft.user.name ?? '预览用户', ...draft.user } as ManagedUser),
  createContact: async (draft) => ({ id: `preview-contact-${sequence++}`, ...draft }),
}

export default function AccountManagementPreviewPage() {
  return (
    <div>
      <div className="page-heading">
        <div><p className="eyebrow">COMPONENT PREVIEW</p><h1>用户管理组件</h1></div>
        <p>提交会写入右侧的本地结果，不访问后端</p>
      </div>
      <AccountManagement dataSource={previewDataSource} />
    </div>
  )
}
