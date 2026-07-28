import { AccountManagement } from '../components/AccountManagement'

export default function AccountManagementPage() {
  return (
    <div>
      <div className="page-heading">
        <div><p className="eyebrow">IDENTITY</p><h1>用户与联系人</h1></div>
        <p>创建账号、同步授权范围和登记业务联系人</p>
      </div>
      <AccountManagement />
    </div>
  )
}
