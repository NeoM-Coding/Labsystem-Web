import { AccountManagement } from '../components/AccountManagement'

export default function AccountManagementPage() {
  return (
    <div>
      <div className="page-heading">
        <div><p className="eyebrow">IDENTITY</p><h1>用户与联系人</h1></div>
        <p>查询系统用户、维护账号资料与分层授权范围</p>
      </div>
      <AccountManagement />
    </div>
  )
}
