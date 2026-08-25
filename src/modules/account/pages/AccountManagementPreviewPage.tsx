import { AccountManagement } from '../components/AccountManagement'
import type { AccountManagementDataSource } from '../components/AccountManagement'
import type { ManagedUser } from '../types'

let sequence = 1
const previewUsers: ManagedUser[] = [
  {
    id: 'preview-user-admin',
    name: '林老师',
    username: 'lin.admin',
    phone: '13800000001',
    email: 'lin@example.edu.cn',
    mark: '实验中心管理员',
    createAt: '2026-07-01T08:00:00Z',
    updateAt: '2026-07-24T08:00:00Z',
  },
  {
    id: 'preview-user-edu',
    name: '周老师',
    username: 'zhou.edu',
    email: 'zhou@example.edu.cn',
    mark: '教务排课负责人',
    createAt: '2026-07-12T08:00:00Z',
    updateAt: '2026-07-24T08:00:00Z',
  },
]

const previewDataSource: AccountManagementDataSource = {
  listUsers: async () => previewUsers,
  listUserPermissions: async (userId) => userId === 'preview-user-admin'
    ? ['user_manager', 'user_viewer', 'laboratory_manager']
    : ['edu_timetable_manager'],
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
        <p>确定性数据：2 位系统用户 · 可检查搜索、列表、编辑器与授权树</p>
      </div>
      <AccountManagement dataSource={previewDataSource} operatorUserId="preview-user-admin" />
    </div>
  )
}
