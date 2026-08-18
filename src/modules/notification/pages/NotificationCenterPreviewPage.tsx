import { useEffect } from 'react'
import { NotificationCenter } from '../components/NotificationCenter'
import { useNotificationStore } from '../store/notificationStore'
import type { RuleActionResult, RuleExecutionEvent } from '../types'

function action(overrides: Partial<RuleActionResult>): RuleActionResult {
  return {
    index: 0,
    type: 'Control',
    targetId: 'dev-air-01',
    userIds: [],
    reportTypes: [],
    content: null,
    status: 'SUCCESS',
    message: 'mqtt control completed',
    completedAt: '2026-08-11T08:00:01Z',
    ...overrides,
  }
}

function event(id: string, actions: RuleActionResult[], actionGroupId: string): RuleExecutionEvent {
  const occurredAt = `2026-08-11T08:0${id.slice(-1)}:01Z`
  return {
    version: '1.0',
    eventId: id,
    eventType: 'rule.action-group.executed',
    occurredAt,
    source: 'rule-engine',
    traceId: `trace-${id}`,
    resource: { type: 'runtime', id: 'temperature-guard', laboratoryId: null },
    data: {
      eventId: id,
      runtimeId: 'temperature-guard',
      actionGroupId,
      deviceConditionGroupId: '室温过高',
      timeConditionGroupId: '工作时间',
      matchedAt: occurredAt,
      completedAt: occurredAt,
      traceId: `trace-${id}`,
      actions,
    },
  }
}

const notificationPreviewEvents = [
  event('notice-3', [
    action({ status: 'FAILED', message: 'device timeout' }),
    action({
      index: 1,
      type: 'Report',
      targetId: null,
      userIds: ['user-1'],
      reportTypes: ['SMS', 'SMTP'],
      content: '温度告警控制失败，请及时检查设备。',
      status: 'NOT_IMPLEMENTED',
      message: 'report delivery capability is not implemented',
    }),
  ], '控制失败告警'),
  event('notice-2', [
    action({}),
    action({
      index: 1,
      type: 'Report',
      targetId: null,
      userIds: ['user-1', 'contact-1'],
      reportTypes: [],
      content: '室温超过阈值，空调降温动作已执行。',
      status: 'NOT_IMPLEMENTED',
      message: 'external channels are not implemented',
    }),
  ], '高温自动降温'),
  event('notice-1', [
    action({ targetId: 'dev-light-01' }),
    action({
      index: 1,
      type: 'Report',
      targetId: null,
      userIds: ['user-1'],
      content: '无人时段照明已关闭。',
      status: 'NOT_IMPLEMENTED',
    }),
  ], '无人时关闭照明'),
]

export default function NotificationCenterPreviewPage() {
  const messages = useNotificationStore((state) => state.messages)
  const hydratePreview = useNotificationStore((state) => state.hydratePreview)

  useEffect(() => {
    hydratePreview(notificationPreviewEvents)
    return () => useNotificationStore.getState().reset()
  }, [hydratePreview])

  const unread = messages.filter((message) => !message.read).length
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-extrabold tracking-[.12em] text-[#18825c]">COMPONENT PREVIEW</p>
        <h1 className="m-0 text-3xl font-bold tracking-[-.025em]">规则站内信</h1>
        <p className="mt-2 text-sm text-[#74827c]">点击右侧消息按钮，检查定向通知、成功、失败和未实现通道；无接收人的动作组不会进入收件箱。</p>
      </div>
      <section className="flex items-center justify-between gap-5 rounded-2xl border border-[#dfe8e3] bg-white p-5 shadow-[0_8px_30px_rgb(17_48_38_/_5%)]">
        <div><small className="font-bold text-[#78877f]">组件输出状态</small><strong className="mt-1 block text-lg text-[#253d33]">{messages.length} 条消息 · {unread} 条未读</strong><p className="mt-1 mb-0 text-xs text-[#84928c]">标记已读或清空后，此处会立即同步。</p></div>
        <NotificationCenter />
      </section>
      <button type="button" onClick={() => hydratePreview(notificationPreviewEvents)} className="rounded-xl bg-[#e3f2eb] px-4 py-2.5 text-sm font-bold text-[#176d4f]">恢复预览消息</button>
    </div>
  )
}
