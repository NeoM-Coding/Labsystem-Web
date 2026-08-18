import { pageAlertLogs } from '../api/logs'
import { AlertLogExplorer } from '../components/AlertLogExplorer'

export default function AlertLogPage() {
  return (
    <div>
      <div className="page-heading">
        <div><p className="eyebrow">AUTOMATION EVENTS</p><h1>智能控制告警日志</h1></div>
        <p>查看策略命中、动作执行结果与通知接收人</p>
      </div>
      <AlertLogExplorer loadLogs={pageAlertLogs} />
    </div>
  )
}
