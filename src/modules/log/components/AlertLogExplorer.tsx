import { useCallback, useEffect, useState } from 'react'
import { listUsers } from '@/modules/account/api/accounts'
import { getStrategy } from '@/modules/strategy/api/strategies'
import type { ManagedUser } from '@/modules/account/types'
import type { RuntimeRevision } from '@/modules/strategy/types'
import type {
  AlertLogLoader,
  AlertLogQuery,
  PageResult,
  RuleAlertLog,
  StrategyLoader,
  UserLoader,
} from '../types'
import {
  DetailDialog,
  DetailList,
  LinkButton,
  LogPagination,
  StatusBadge,
} from './LogUi'
import { formatDateTime, logInputClass } from './logUtils'

const emptyPage: PageResult<RuleAlertLog> = { records: [], total: 0, current: 1, size: 20, pages: 0 }
const initialFilters = { runtimeId: '', actionGroupId: '', status: '', matchedFrom: '', matchedTo: '' }

type DialogState =
  | { type: 'log'; log: RuleAlertLog }
  | { type: 'strategy'; runtimeId: string }
  | { type: 'users'; userIds: string[] }

export function AlertLogExplorer({
  loadLogs,
  loadStrategy = getStrategy,
  loadUsers = listUsers,
}: {
  loadLogs: AlertLogLoader
  loadStrategy?: StrategyLoader
  loadUsers?: UserLoader
}) {
  const [filters, setFilters] = useState(initialFilters)
  const [applied, setApplied] = useState(initialFilters)
  const [page, setPage] = useState(emptyPage)
  const [current, setCurrent] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [strategy, setStrategy] = useState<RuntimeRevision | null>(null)
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const query: AlertLogQuery = {
      current,
      size: 20,
      runtimeId: applied.runtimeId || undefined,
      actionGroupId: applied.actionGroupId || undefined,
      status: applied.status || undefined,
      matchedFrom: applied.matchedFrom || undefined,
      matchedTo: applied.matchedTo || undefined,
    }
    try {
      setPage(await loadLogs(query))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '加载告警日志失败')
    } finally {
      setLoading(false)
    }
  }, [applied, current, loadLogs])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (!dialog || dialog.type === 'log') return
    let active = true
    setDetailLoading(true)
    setDetailError(null)
    if (dialog.type === 'strategy') {
      setStrategy(null)
      void loadStrategy(dialog.runtimeId)
        .then((value) => { if (active) setStrategy(value) })
        .catch((cause: unknown) => { if (active) setDetailError(cause instanceof Error ? cause.message : '加载策略详情失败') })
        .finally(() => { if (active) setDetailLoading(false) })
    } else {
      setUsers([])
      void loadUsers()
        .then((value) => { if (active) setUsers(value.filter((user) => dialog.userIds.includes(user.id))) })
        .catch((cause: unknown) => { if (active) setDetailError(cause instanceof Error ? cause.message : '加载用户详情失败') })
        .finally(() => { if (active) setDetailLoading(false) })
    }
    return () => { active = false }
  }, [dialog, loadStrategy, loadUsers])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setCurrent(1)
    setApplied(filters)
  }

  return (
    <section aria-label="智能控制告警日志查询">
      <form onSubmit={submit} className="grid grid-cols-5 gap-3 rounded-2xl border border-[#dce6e1] bg-white p-4 shadow-[0_10px_34px_rgb(17_48_38_/_5%)] max-xl:grid-cols-2 max-md:grid-cols-1">
        <label><span className="mb-1.5 block text-xs font-bold text-[#687a72]">策略 Runtime ID</span><input value={filters.runtimeId} onChange={(event) => setFilters({ ...filters, runtimeId: event.target.value })} placeholder="精确策略 ID" className={`${logInputClass} w-full`} /></label>
        <label><span className="mb-1.5 block text-xs font-bold text-[#687a72]">动作组 ID</span><input value={filters.actionGroupId} onChange={(event) => setFilters({ ...filters, actionGroupId: event.target.value })} placeholder="精确动作组 ID" className={`${logInputClass} w-full`} /></label>
        <label><span className="mb-1.5 block text-xs font-bold text-[#687a72]">执行状态</span><select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className={`${logInputClass} w-full`}><option value="">全部状态</option><option value="SUCCESS">成功</option><option value="FAILED">失败</option><option value="PARTIAL_FAILED">部分失败</option><option value="MATCHED">已命中</option><option value="NOT_IMPLEMENTED">未实现</option></select></label>
        <label><span className="mb-1.5 block text-xs font-bold text-[#687a72]">命中开始时间</span><input type="datetime-local" value={filters.matchedFrom} onChange={(event) => setFilters({ ...filters, matchedFrom: event.target.value })} className={`${logInputClass} w-full`} /></label>
        <label><span className="mb-1.5 block text-xs font-bold text-[#687a72]">命中结束时间</span><input type="datetime-local" value={filters.matchedTo} onChange={(event) => setFilters({ ...filters, matchedTo: event.target.value })} className={`${logInputClass} w-full`} /></label>
        <div className="col-span-5 flex justify-end gap-2 max-xl:col-span-2 max-md:col-span-1">
          <button type="button" onClick={() => { setFilters(initialFilters); setApplied(initialFilters); setCurrent(1) }} className="h-10 rounded-xl bg-[#edf3f0] px-4 text-sm font-bold text-[#53665e]">清空</button>
          <button type="submit" className="h-10 rounded-xl bg-[#147a56] px-5 text-sm font-bold text-white">查询告警</button>
        </div>
      </form>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
      <div className="mt-5 overflow-hidden rounded-2xl border border-[#dce6e1] bg-white shadow-[0_8px_28px_rgb(17_48_38_/_5%)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-left">
            <thead className="bg-[#f3f7f5] text-xs text-[#64766e]"><tr><th className="px-5 py-3">命中时间</th><th className="px-4 py-3">策略 / 动作组</th><th className="px-4 py-3">状态</th><th className="px-4 py-3">通知内容</th><th className="px-4 py-3">相关用户</th><th className="px-5 py-3">动作结果</th></tr></thead>
            <tbody>
              {page.records.map((log) => (
                <tr key={log.id} className="border-t border-[#e5ece8] align-top hover:bg-[#f8fbf9]">
                  <td className="whitespace-nowrap px-5 py-4 text-xs text-[#667870]"><p className="m-0">{formatDateTime(log.matchedAt)}</p><p className="mt-1 mb-0 text-[10px] text-[#8a9792]">完成 {formatDateTime(log.completedAt)}</p></td>
                  <td className="max-w-56 px-4 py-4 text-xs"><LinkButton onClick={() => setDialog({ type: 'strategy', runtimeId: log.runtimeId })} title="查看策略详情"><span className="font-mono">{log.runtimeId}</span></LinkButton><p className="mt-1 mb-0 truncate font-mono text-[10px] text-[#73847c]" title={log.actionGroupId}>{log.actionGroupId}</p></td>
                  <td className="px-4 py-4"><StatusBadge status={log.status} /></td>
                  <td className="max-w-72 px-4 py-4 text-sm leading-6 text-[#4d6259]"><button type="button" onClick={() => setDialog({ type: 'log', log })} className="line-clamp-2 text-left hover:text-[#147a56]">{log.content || '查看本次命中详情'}</button></td>
                  <td className="px-4 py-4 text-sm">{log.userIds.length ? <LinkButton onClick={() => setDialog({ type: 'users', userIds: log.userIds })}>{log.userIds.length} 位用户</LinkButton> : <span className="text-[#98a49f]">无</span>}</td>
                  <td className="px-5 py-4"><LinkButton onClick={() => setDialog({ type: 'log', log })}>{log.actions.length} 个动作</LinkButton><p className="mt-1 mb-0 font-mono text-[10px] text-[#8b9893]">event {log.eventId}</p></td>
                </tr>
              ))}
              {!loading && page.records.length === 0 && <tr><td colSpan={6} className="px-5 py-16 text-center text-sm text-[#87958f]">没有符合条件的智能控制告警日志</td></tr>}
              {loading && <tr><td colSpan={6} className="px-5 py-16 text-center text-sm text-[#87958f]">正在加载告警日志…</td></tr>}
            </tbody>
          </table>
        </div>
        <LogPagination current={page.current} pages={page.pages} total={page.total} loading={loading} onChange={setCurrent} />
      </div>
      {dialog?.type === 'log' && (
        <DetailDialog eyebrow="RULE ALERT" title={`动作组 ${dialog.log.actionGroupId}`} onClose={() => setDialog(null)}>
          <DetailList rows={[
            ['策略', <LinkButton onClick={() => setDialog({ type: 'strategy', runtimeId: dialog.log.runtimeId })}>{dialog.log.runtimeId}</LinkButton>],
            ['整体状态', <StatusBadge status={dialog.log.status} />],
            ['事件 ID', <span className="font-mono text-xs">{dialog.log.eventId}</span>],
            ['设备条件组', dialog.log.deviceConditionGroupId],
            ['时间条件组', dialog.log.timeConditionGroupId],
            ['命中时间', formatDateTime(dialog.log.matchedAt)],
            ['完成时间', formatDateTime(dialog.log.completedAt)],
            ['通知内容', <span className="whitespace-pre-wrap">{dialog.log.content || '—'}</span>],
            ['相关用户', dialog.log.userIds.length ? <LinkButton onClick={() => setDialog({ type: 'users', userIds: dialog.log.userIds })}>{dialog.log.userIds.length} 位用户</LinkButton> : '无'],
          ]} />
          <div className="mt-5 grid gap-3">
            {dialog.log.actions.map((action) => (
              <article key={`${action.index}-${action.type}`} className="rounded-2xl border border-[#e3ebe7] p-4">
                <div className="flex items-center justify-between gap-3"><strong className="text-sm">#{action.index + 1} · {action.type}</strong><StatusBadge status={action.status} /></div>
                <p className="mt-2 mb-0 text-xs text-[#6d7d76]">目标：<span className="font-mono">{action.targetId || '—'}</span></p>
                {action.reportTypes.length > 0 && <p className="mt-1 mb-0 text-xs text-[#6d7d76]">渠道：{action.reportTypes.join('、')}</p>}
                {action.message && <p className="mt-2 mb-0 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{action.message}</p>}
                {action.content && <p className="mt-2 mb-0 whitespace-pre-wrap text-xs leading-5 text-[#53665e]">{action.content}</p>}
              </article>
            ))}
          </div>
        </DetailDialog>
      )}
      {dialog?.type === 'strategy' && (
        <DetailDialog eyebrow="SMART STRATEGY" title={dialog.runtimeId} onClose={() => setDialog(null)}>
          {detailLoading && <p className="text-sm text-[#72827b]">正在加载策略详情…</p>}
          {detailError && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{detailError}</p>}
          {strategy && <DetailList rows={[
            ['Runtime ID', strategy.runtimeId],
            ['运行状态', strategy.enabled ? '已启用' : '已停用'],
            ['有效期', `${formatDateTime(strategy.activeFrom)} — ${formatDateTime(strategy.activeUntil)}`],
            ['设备条件组', `${strategy.deviceConditionGroups.length} 个`],
            ['时间条件组', `${strategy.timeConditionGroups.length} 个`],
            ['动作组', strategy.actionGroups.map((group) => group.actionGroupId).join('、')],
          ]} />}
        </DetailDialog>
      )}
      {dialog?.type === 'users' && (
        <DetailDialog eyebrow="RECIPIENTS" title="相关用户" onClose={() => setDialog(null)}>
          {detailLoading && <p className="text-sm text-[#72827b]">正在加载用户详情…</p>}
          {detailError && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{detailError}</p>}
          {!detailLoading && <div className="grid gap-3">{dialog.userIds.map((userId) => {
            const user = users.find((candidate) => candidate.id === userId)
            return <article key={userId} className="rounded-2xl border border-[#e3ebe7] p-4"><strong>{user?.name || '未知用户'}</strong><p className="mt-1 mb-0 text-xs text-[#6e7e77]">{user?.username ? `@${user.username}` : user?.email || user?.phone || '无联系信息'}</p><p className="mt-2 mb-0 break-all font-mono text-[10px] text-[#8a9792]">{userId}</p></article>
          })}</div>}
        </DetailDialog>
      )}
    </section>
  )
}
