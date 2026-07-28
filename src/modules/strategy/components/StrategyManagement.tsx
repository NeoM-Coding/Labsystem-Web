import { useEffect, useMemo, useState } from 'react'
import { useDeviceStore } from '@/modules/device/store/deviceStore'
import { useStrategyStore } from '../store/strategyStore'
import type { RuntimeRevision } from '../types'
import { StrategyRevisionForm } from './StrategyRevisionForm'

function activeLabel(revision: RuntimeRevision) {
  if (!revision.activeFrom && !revision.activeUntil) return '长期有效'
  const from = revision.activeFrom ? new Date(revision.activeFrom).toLocaleString('zh-CN') : '现在'
  const until = revision.activeUntil ? new Date(revision.activeUntil).toLocaleString('zh-CN') : '长期'
  return `${from} — ${until}`
}

export function StrategyManagement({ preview = false }: { preview?: boolean }) {
  const store = useStrategyStore()
  const devicesById = useDeviceStore((state) => state.devicesById)
  const devices = useMemo(() => Object.values(devicesById), [devicesById])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<RuntimeRevision | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<RuntimeRevision | null>(null)
  const [pendingIds, setPendingIds] = useState<string[]>([])
  const [savingEditor, setSavingEditor] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!preview && store.status === 'idle') void store.load().catch(() => undefined)
  }, [preview, store])

  const query = search.trim().toLowerCase()
  const revisions = useMemo(() => Object.values(store.revisionsById)
    .filter((revision) => !query || revision.runtimeId.toLowerCase().includes(query))
    .sort((left, right) => left.runtimeId.localeCompare(right.runtimeId)), [query, store.revisionsById])

  const run = async (runtimeId: string, operation: () => Promise<void>) => {
    setPendingIds((ids) => [...ids, runtimeId])
    setError(null)
    try {
      await operation()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '操作失败')
      throw cause
    } finally {
      setPendingIds((ids) => ids.filter((id) => id !== runtimeId))
    }
  }

  const save = async (revision: RuntimeRevision) => {
    setSavingEditor(true)
    try {
      await run(revision.runtimeId, async () => {
        if (preview) store.upsertLocal(revision)
        else if (editing) await store.update(editing.runtimeId, revision)
        else await store.create(revision)
        setEditing(undefined)
      })
    } finally {
      setSavingEditor(false)
    }
  }

  const toggle = async (revision: RuntimeRevision, enabled: boolean) => {
    if (preview) {
      store.upsertLocal({ ...revision, enabled })
      return
    }
    await run(revision.runtimeId, () => store.setEnabled(revision.runtimeId, enabled))
  }

  const edit = async (revision: RuntimeRevision) => {
    if (preview) {
      setEditing(revision)
      return
    }
    await run(revision.runtimeId, async () => {
      setEditing(await store.get(revision.runtimeId))
    })
  }

  return (
    <section aria-label="智能策略管理">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#dce6e1] bg-white p-3 shadow-[0_10px_34px_rgb(17_48_38_/_5%)]">
        <label className="min-w-60 flex-1"><span className="sr-only">搜索策略</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索 Runtime ID" className="h-11 w-full rounded-xl border border-[#d9e4df] px-3 text-sm outline-none focus:border-[#48a17f]" /></label>
        <span className="rounded-lg bg-[#edf4f1] px-3 py-2 text-xs font-bold text-[#61736b]">{revisions.length} 项策略</span>
        <button type="button" onClick={() => setEditing(null)} className="rounded-xl bg-[#147a56] px-4 py-3 text-sm font-bold text-white active:scale-[.97]">新增策略</button>
      </div>
      {(error || store.error) && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error ?? store.error}</p>}
      <div className="mt-5 grid grid-cols-2 gap-4 max-xl:grid-cols-1">
        {revisions.map((revision) => {
          const pending = pendingIds.includes(revision.runtimeId)
          return (
            <article key={revision.runtimeId} className="rounded-2xl border border-[#dce6e1] bg-white p-5 shadow-[0_8px_28px_rgb(17_48_38_/_5%)]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="m-0 truncate font-mono text-base">{revision.runtimeId}</h2>
                  <p className="mt-1 mb-0 truncate text-xs text-[#798881]">{activeLabel(revision)}</p>
                </div>
                <label className="flex shrink-0 items-center gap-2 text-xs font-bold text-[#5f7169]">
                  {revision.enabled ? '已启用' : '已停用'}
                  <input type="checkbox" checked={revision.enabled} disabled={pending} onChange={(event) => void toggle(revision, event.target.checked).catch(() => undefined)} className="size-5 accent-[#16805a]" />
                </label>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-[#f1f6f3] p-3"><span className="block text-[11px] text-[#819089]">设备条件组</span><strong>{revision.deviceConditionGroups.length}</strong></div>
                <div className="rounded-xl bg-[#f1f6f3] p-3"><span className="block text-[11px] text-[#819089]">时间条件组</span><strong>{revision.timeConditionGroups.length}</strong></div>
                <div className="rounded-xl bg-[#f1f6f3] p-3"><span className="block text-[11px] text-[#819089]">动作组</span><strong>{revision.actionGroups.length}</strong></div>
              </div>
              <div className="mt-5 flex justify-end gap-2 border-t border-[#e7edea] pt-4">
                <button type="button" disabled={pending} onClick={() => void edit(revision).catch(() => undefined)} className="rounded-lg bg-[#edf4f1] px-3 py-2 text-xs font-bold text-[#176c4e] active:scale-[.96] disabled:opacity-50">编辑策略</button>
                <button type="button" onClick={() => setDeleting(revision)} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 active:scale-[.96]">删除</button>
              </div>
            </article>
          )
        })}
      </div>
      {editing !== undefined && (
        <StrategyRevisionForm
          initialValue={editing}
          mode={editing ? 'edit' : 'create'}
          devices={devices}
          saving={savingEditor}
          onCancel={() => setEditing(undefined)}
          onSubmit={save}
        />
      )}
      {deleting && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-[#092018]/30 p-5 backdrop-blur-[3px]" role="alertdialog" aria-modal="true" aria-label="确认删除智能策略">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_24px_80px_rgb(8_39_29_/_25%)]">
            <h2 className="m-0 text-xl">删除策略？</h2>
            <p className="mt-3 break-all text-sm leading-6 text-[#677870]">{deleting.runtimeId} 的持久化版本和运行时都会被移除。</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleting(null)} className="rounded-xl bg-[#edf3f0] px-4 py-2.5 text-sm font-bold">取消</button>
              <button type="button" disabled={pendingIds.includes(deleting.runtimeId)} onClick={() => void run(deleting.runtimeId, async () => {
                if (preview) store.removeLocal(deleting.runtimeId)
                else await store.remove(deleting.runtimeId)
                setDeleting(null)
              }).catch(() => undefined)} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white active:scale-[.97] disabled:opacity-50">确认删除</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
