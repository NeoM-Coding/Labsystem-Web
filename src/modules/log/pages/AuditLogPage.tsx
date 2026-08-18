import { pageAuditLogs } from '../api/logs'
import { AuditLogExplorer } from '../components/AuditLogExplorer'

export default function AuditLogPage() {
  return (
    <div>
      <div className="page-heading">
        <div><p className="eyebrow">TRACEABILITY</p><h1>审计日志</h1></div>
        <p>追溯管理员操作、业务资源与请求链路</p>
      </div>
      <AuditLogExplorer loadLogs={pageAuditLogs} />
    </div>
  )
}
