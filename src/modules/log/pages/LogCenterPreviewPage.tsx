import { AlertLogExplorer } from '../components/AlertLogExplorer'
import { AuditLogExplorer } from '../components/AuditLogExplorer'
import type { AlertLogLoader, AuditLogLoader } from '../types'

const auditLoader: AuditLogLoader = async (query) => ({
  records: [{
    id: 'audit-1', subjectId: 'user-1', subjectName: 'admin', subjectDisplayName: '张管理员',
    operation: 'TimetableService#create', actions: 'manage_timetable', objectTypes: 'timetable',
    objectIds: 'timetable-2026-001', eventTypes: 'CREATE', description: '张管理员 创建了高等数学课表',
    traceId: '2748357524dd58ba9c65df975cd88cf0', requestId: '3fe791fba62a04daa698e505',
    occurredAt: '2026-08-12T09:30:00',
  }],
  total: 1, current: query.current, size: query.size, pages: 1,
})

const alertLoader: AlertLogLoader = async (query) => ({
  records: [{
    id: 'alert-1', eventId: 'event-20260812-01', runtimeId: 'night-air-condition-guard',
    actionGroupId: 'cooling-action', deviceConditionGroupId: 'room-temperature',
    timeConditionGroupId: 'night-window', matchedAt: '2026-08-12T01:20:00Z',
    completedAt: '2026-08-12T01:20:02Z', status: 'PARTIAL_FAILED',
    content: '夜间室温超过阈值，已执行降温并通知值班人员。', userIds: ['user-1'],
    actions: [{ index: 0, type: 'Control', targetId: 'dev-air-01', userIds: [], reportTypes: [], content: null, status: 'SUCCESS', message: null, completedAt: '2026-08-12T01:20:01Z' }, { index: 1, type: 'Report', targetId: null, userIds: ['user-1'], reportTypes: ['SMS'], content: '夜间高温告警', status: 'FAILED', message: '短信网关暂不可用', completedAt: '2026-08-12T01:20:02Z' }],
    createAt: '2026-08-12T09:20:02',
  }],
  total: 1, current: query.current, size: query.size, pages: 1,
})

const previewStrategy = async (runtimeId: string) => ({
  runtimeId, enabled: true, activeFrom: null, activeUntil: null,
  deviceConditionGroups: [{ groupId: 'room-temperature', conditions: [] }],
  timeConditionGroups: [{ groupId: 'night-window', conditions: [] }],
  actionGroups: [{ actionGroupId: 'cooling-action', deviceConditionGroupId: 'room-temperature', timeConditionGroupId: 'night-window', actions: [] }],
})

const previewUsers = async () => [{ id: 'user-1', name: '张管理员', username: 'admin', email: 'admin@example.edu.cn' }]

export default function LogCenterPreviewPage() {
  return (
    <div>
      <div className="page-heading"><div><p className="eyebrow">COMPONENT PREVIEW</p><h1>日志中心组件</h1></div><p>使用本地固定数据，可检查筛选、分页和关联详情 Dialog</p></div>
      <h2 className="mt-0 text-lg">审计日志</h2>
      <AuditLogExplorer loadLogs={auditLoader} />
      <h2 className="mt-10 text-lg">智能控制告警日志</h2>
      <AlertLogExplorer loadLogs={alertLoader} loadStrategy={previewStrategy} loadUsers={previewUsers} />
    </div>
  )
}
