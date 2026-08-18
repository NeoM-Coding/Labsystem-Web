import { useCallback, useEffect, useState } from 'react'
import type { AuditLog, AuditLogLoader, AuditLogQuery, PageResult } from '../types'
import {
  DetailDialog,
  DetailList,
  LinkButton,
  LogPagination,
} from './LogUi'
import { formatDateTime, logInputClass, splitValues } from './logUtils'

const emptyPage: PageResult<AuditLog> = { records: [], total: 0, current: 1, size: 20, pages: 0 }
const initialFilters = { subjectName: '', subjectDisplayName: '', operation: '', object: '', traceId: '', occurredFrom: '', occurredTo: '' }

export function AuditLogExplorer({ loadLogs }: { loadLogs: AuditLogLoader }) {
  const [filters, setFilters] = useState(initialFilters)
  const [applied, setApplied] = useState(initialFilters)
  const [page, setPage] = useState(emptyPage)
  const [current, setCurrent] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<AuditLog | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const query: AuditLogQuery = {
      current,
      size: 20,
      subjectName: applied.subjectName || undefined,
      subjectDisplayName: applied.subjectDisplayName || undefined,
      operation: applied.operation || undefined,
      objectId: applied.object || undefined,
      traceId: applied.traceId || undefined,
      occurredFrom: applied.occurredFrom || undefined,
      occurredTo: applied.occurredTo || undefined,
    }
    try {
      setPage(await loadLogs(query))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '加载审计日志失败')
    } finally {
      setLoading(false)
    }
  }, [applied, current, loadLogs])

  useEffect(() => { void load() }, [load])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setCurrent(1)
    setApplied(filters)
  }

  return (
    <section aria-label="审计日志查询">
      <form onSubmit={submit} className="grid grid-cols-4 gap-3 rounded-2xl border border-[#dce6e1] bg-white p-4 shadow-[0_10px_34px_rgb(17_48_38_/_5%)] max-xl:grid-cols-2 max-md:grid-cols-1">
        <label><span className="mb-1.5 block text-xs font-bold text-[#687a72]">操作人姓名</span><input value={filters.subjectDisplayName} onChange={(event) => setFilters({ ...filters, subjectDisplayName: event.target.value })} placeholder="模糊匹配显示名称" className={`${logInputClass} w-full`} /></label>
        <label><span className="mb-1.5 block text-xs font-bold text-[#687a72]">操作人用户名</span><input value={filters.subjectName} onChange={(event) => setFilters({ ...filters, subjectName: event.target.value })} placeholder="模糊匹配用户名" className={`${logInputClass} w-full`} /></label>
        <label><span className="mb-1.5 block text-xs font-bold text-[#687a72]">操作</span><input value={filters.operation} onChange={(event) => setFilters({ ...filters, operation: event.target.value })} placeholder="精确操作名称" className={`${logInputClass} w-full`} /></label>
        <label><span className="mb-1.5 block text-xs font-bold text-[#687a72]">资源 ID</span><input value={filters.object} onChange={(event) => setFilters({ ...filters, object: event.target.value })} placeholder="模糊匹配资源" className={`${logInputClass} w-full`} /></label>
        <label><span className="mb-1.5 block text-xs font-bold text-[#687a72]">Trace ID</span><input value={filters.traceId} onChange={(event) => setFilters({ ...filters, traceId: event.target.value })} placeholder="精确链路标识" className={`${logInputClass} w-full font-mono`} /></label>
        <label><span className="mb-1.5 block text-xs font-bold text-[#687a72]">开始时间</span><input type="datetime-local" value={filters.occurredFrom} onChange={(event) => setFilters({ ...filters, occurredFrom: event.target.value })} className={`${logInputClass} w-full`} /></label>
        <label><span className="mb-1.5 block text-xs font-bold text-[#687a72]">结束时间</span><input type="datetime-local" value={filters.occurredTo} onChange={(event) => setFilters({ ...filters, occurredTo: event.target.value })} className={`${logInputClass} w-full`} /></label>
        <div className="col-span-2 flex items-end justify-end gap-2 max-xl:col-span-2 max-md:col-span-1">
          <button type="button" onClick={() => { setFilters(initialFilters); setApplied(initialFilters); setCurrent(1) }} className="h-10 rounded-xl bg-[#edf3f0] px-4 text-sm font-bold text-[#53665e]">清空</button>
          <button type="submit" className="h-10 rounded-xl bg-[#147a56] px-5 text-sm font-bold text-white">查询日志</button>
        </div>
      </form>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
      <div className="mt-5 overflow-hidden rounded-2xl border border-[#dce6e1] bg-white shadow-[0_8px_28px_rgb(17_48_38_/_5%)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-[#f3f7f5] text-xs text-[#64766e]"><tr><th className="px-5 py-3">发生时间</th><th className="px-4 py-3">操作人</th><th className="px-4 py-3">操作</th><th className="px-4 py-3">资源</th><th className="px-4 py-3">描述</th><th className="px-5 py-3">链路</th></tr></thead>
            <tbody>
              {page.records.map((log) => (
                <tr key={log.id} className="border-t border-[#e5ece8] align-top hover:bg-[#f8fbf9]">
                  <td className="whitespace-nowrap px-5 py-4 text-xs text-[#667870]">{formatDateTime(log.occurredAt)}</td>
                  <td className="max-w-44 px-4 py-4 text-sm"><LinkButton onClick={() => setSelected(log)} title="查看操作人详情">{log.subjectDisplayName || log.subjectName || log.subjectId || '未知用户'}</LinkButton></td>
                  <td className="px-4 py-4"><p className="m-0 font-mono text-xs font-bold text-[#294139]">{log.operation || '—'}</p><p className="mt-1 mb-0 text-[10px] text-[#73847c]">{splitValues(log.actions).join(' · ') || '无动作信息'}</p></td>
                  <td className="max-w-48 px-4 py-4 text-xs"><p className="m-0 truncate font-semibold" title={log.objectTypes ?? undefined}>{splitValues(log.objectTypes).join(' · ') || '—'}</p><p className="mt-1 mb-0 truncate font-mono text-[10px] text-[#7d8b85]" title={log.objectIds ?? undefined}>{splitValues(log.objectIds).join(' · ') || '—'}</p></td>
                  <td className="max-w-80 px-4 py-4 text-sm leading-6 text-[#4d6259]"><button type="button" onClick={() => setSelected(log)} className="line-clamp-2 text-left hover:text-[#147a56]">{log.description || '查看日志详情'}</button></td>
                  <td className="max-w-40 px-5 py-4"><LinkButton onClick={() => setSelected(log)} title="查看链路详情"><span className="block truncate font-mono text-[10px]">{log.traceId || log.requestId || '—'}</span></LinkButton></td>
                </tr>
              ))}
              {!loading && page.records.length === 0 && <tr><td colSpan={6} className="px-5 py-16 text-center text-sm text-[#87958f]">没有符合条件的审计日志</td></tr>}
              {loading && <tr><td colSpan={6} className="px-5 py-16 text-center text-sm text-[#87958f]">正在加载审计日志…</td></tr>}
            </tbody>
          </table>
        </div>
        <LogPagination current={page.current} pages={page.pages} total={page.total} loading={loading} onChange={setCurrent} />
      </div>
      {selected && (
        <DetailDialog eyebrow="AUDIT LOG" title={selected.subjectDisplayName || selected.subjectName || '审计日志详情'} onClose={() => setSelected(null)}>
          <DetailList rows={[
            ['操作人', selected.subjectDisplayName || selected.subjectName],
            ['用户名', selected.subjectName],
            ['用户 ID', selected.subjectId],
            ['操作', selected.operation],
            ['权限动作', splitValues(selected.actions).join('、')],
            ['资源类型', splitValues(selected.objectTypes).join('、')],
            ['资源 ID', splitValues(selected.objectIds).join('、')],
            ['事件类型', splitValues(selected.eventTypes).join('、')],
            ['说明', selected.description],
            ['Trace ID', <span className="font-mono text-xs">{selected.traceId || '—'}</span>],
            ['Request ID', <span className="font-mono text-xs">{selected.requestId || '—'}</span>],
            ['发生时间', formatDateTime(selected.occurredAt)],
          ]} />
        </DetailDialog>
      )}
    </section>
  )
}
