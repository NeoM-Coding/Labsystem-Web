import { useEffect, useMemo, useState } from 'react'
import { useLaboratoryStore } from '../store/laboratoryStore'
import type {
  Laboratory,
  LaboratoryDraft,
  LaboratoryManager,
} from '../types'

const inputClass = 'h-11 min-w-0 rounded-xl border border-[#d9e4df] bg-white px-3 text-sm text-[#20342c] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#48a17f] focus:shadow-[0_0_0_3px_rgb(72_161_127_/_13%)]'

const emptyDraft = (): LaboratoryDraft => ({
  buildingName: '',
  orgName: '',
  laboratoryName: '',
  extra: null,
  manager: [],
})

function draftFrom(laboratory: Laboratory): LaboratoryDraft {
  return {
    buildingName: laboratory.buildingName,
    orgName: laboratory.orgName ?? '',
    laboratoryName: laboratory.laboratoryName,
    extra: laboratory.extra,
    manager: laboratory.managers.map((manager) => ({ ...manager })),
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid min-w-0 gap-1.5 text-xs font-bold text-[#65766f]">
      {label}
      {children}
    </label>
  )
}

function LaboratoryEditor({
  laboratory,
  busy,
  onClose,
  onSave,
}: {
  laboratory: Laboratory | null
  busy: boolean
  onClose: () => void
  onSave: (draft: LaboratoryDraft) => Promise<void>
}) {
  const [draft, setDraft] = useState(() => laboratory ? draftFrom(laboratory) : emptyDraft())
  const [extraText, setExtraText] = useState(() => draft.extra ? JSON.stringify(draft.extra, null, 2) : '')
  const [error, setError] = useState<string | null>(null)

  const updateManager = (index: number, patch: Partial<LaboratoryManager>) => {
    setDraft((current) => ({
      ...current,
      manager: current.manager.map((manager, managerIndex) => managerIndex === index
        ? { ...manager, ...patch }
        : manager),
    }))
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!draft.laboratoryName.trim() || !draft.buildingName.trim()) {
      setError('实验室名称和楼栋名称不能为空')
      return
    }
    try {
      const extra = extraText.trim() ? JSON.parse(extraText) as Record<string, unknown> : null
      await onSave({
        ...draft,
        laboratoryName: draft.laboratoryName.trim(),
        buildingName: draft.buildingName.trim(),
        orgName: draft.orgName.trim(),
        extra,
        manager: draft.manager.filter((manager) => manager.name.trim()),
      })
    } catch (cause) {
      setError(cause instanceof SyntaxError
        ? '扩展配置必须是有效的 JSON 对象'
        : cause instanceof Error ? cause.message : '保存失败')
    }
  }

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={laboratory ? '编辑实验室' : '新增实验室'}>
      <button type="button" aria-label="关闭编辑器" onClick={busy ? undefined : onClose} className="absolute inset-0 bg-[#092018]/30 backdrop-blur-[3px]" />
      <form onSubmit={(event) => void submit(event)} className="absolute inset-y-0 right-0 flex w-full max-w-[600px] flex-col border-l border-white/70 bg-[#f9fbfa]/97 shadow-[-24px_0_70px_rgb(8_39_29_/_22%)] backdrop-blur-2xl">
        <header className="flex items-start justify-between gap-4 px-7 pt-7 pb-5">
          <div>
            <p className="mb-1 text-xs font-extrabold tracking-[.12em] text-[#18825c]">{laboratory ? 'EDIT' : 'CREATE'}</p>
            <h2 className="m-0 text-2xl">{laboratory ? '编辑' : '新增'}实验室</h2>
          </div>
          <button type="button" disabled={busy} onClick={onClose} className="rounded-xl bg-[#eaf1ee] px-3 py-2 text-sm font-bold active:scale-[.97] disabled:opacity-50">关闭</button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-28">
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
          <div className="grid gap-5">
            <Field label="实验室名称"><input value={draft.laboratoryName} onChange={(event) => setDraft({ ...draft, laboratoryName: event.target.value })} className={inputClass} /></Field>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <Field label="楼栋名称"><input value={draft.buildingName} onChange={(event) => setDraft({ ...draft, buildingName: event.target.value })} className={inputClass} /></Field>
              <Field label="所属单位"><input value={draft.orgName} onChange={(event) => setDraft({ ...draft, orgName: event.target.value })} className={inputClass} /></Field>
            </div>
            <section className="rounded-2xl border border-[#dce6e1] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="m-0 text-sm">负责人</h3>
                  <p className="mt-1 mb-0 text-xs text-[#819089]">负责人作为实验室资料保存；当前后端没有联系人查询接口。</p>
                </div>
                <button type="button" onClick={() => setDraft({ ...draft, manager: [...draft.manager, { name: '' }] })} className="rounded-lg bg-[#e8f3ee] px-3 py-2 text-xs font-bold text-[#176c4e] active:scale-[.97]">添加</button>
              </div>
              <div className="mt-3 grid gap-3">
                {draft.manager.map((manager, index) => (
                  <div key={`${manager.id ?? 'manager'}-${index}`} className="grid grid-cols-[1fr_1fr_auto] gap-2 rounded-xl bg-[#f3f7f5] p-3 max-sm:grid-cols-1">
                    <input aria-label={`负责人 ${index + 1} 姓名`} placeholder="姓名" value={manager.name} onChange={(event) => updateManager(index, { name: event.target.value })} className={inputClass} />
                    <input aria-label={`负责人 ${index + 1} 联系方式`} placeholder="手机或邮箱" value={manager.phone ?? manager.email ?? ''} onChange={(event) => {
                      const value = event.target.value
                      updateManager(index, value.includes('@') ? { email: value, phone: '' } : { phone: value, email: '' })
                    }} className={inputClass} />
                    <button type="button" aria-label={`移除负责人 ${index + 1}`} onClick={() => setDraft({ ...draft, manager: draft.manager.filter((_, managerIndex) => managerIndex !== index) })} className="rounded-xl px-3 text-sm font-bold text-red-700 active:scale-[.97]">移除</button>
                  </div>
                ))}
                {draft.manager.length === 0 && <p className="m-0 py-3 text-center text-xs text-[#8a9792]">尚未添加负责人</p>}
              </div>
            </section>
            <Field label="扩展配置（JSON，可选）">
              <textarea value={extraText} onChange={(event) => setExtraText(event.target.value)} rows={7} spellCheck={false} placeholder={'{\n  "capacity": 40\n}'} className={`${inputClass} h-auto resize-y py-3 font-mono leading-6`} />
            </Field>
          </div>
        </div>
        <footer className="absolute inset-x-0 bottom-0 flex justify-end gap-3 border-t border-[#dfe8e3] bg-white/92 px-7 py-4 backdrop-blur-xl">
          <button type="button" disabled={busy} onClick={onClose} className="rounded-xl bg-[#edf3f0] px-5 py-3 text-sm font-bold active:scale-[.97]">取消</button>
          <button type="submit" disabled={busy} className="rounded-xl bg-[#147a56] px-6 py-3 text-sm font-bold text-white active:scale-[.97] disabled:opacity-55">{busy ? '正在保存…' : '保存'}</button>
        </footer>
      </form>
    </div>
  )
}

export function LaboratoryManagement({ preview = false }: { preview?: boolean }) {
  const store = useLaboratoryStore()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Laboratory | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Laboratory | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!preview && store.status === 'idle') void store.load().catch(() => undefined)
  }, [preview, store])

  const query = search.trim().toLowerCase()
  const laboratories = useMemo(
    () => Object.values(store.laboratoriesById)
      .filter((laboratory) => !query || [
        laboratory.laboratoryName,
        laboratory.buildingName,
        laboratory.orgName ?? '',
        laboratory.id,
      ].some((value) => value.toLowerCase().includes(query)))
      .sort((left, right) => left.buildingName.localeCompare(right.buildingName, 'zh-CN')),
    [query, store.laboratoriesById],
  )

  const save = async (draft: LaboratoryDraft) => {
    setBusy(true)
    setError(null)
    try {
      if (preview) {
        const now = new Date().toISOString()
        store.upsertLocal({
          id: editing?.id ?? `preview-lab-${Date.now()}`,
          ...draft,
          orgName: draft.orgName || null,
          managers: draft.manager,
          createAt: editing?.createAt ?? now,
          updateAt: now,
        })
      } else if (editing) {
        await store.update(editing.id, draft)
      } else {
        await store.create(draft)
      }
      setEditing(undefined)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存失败')
      throw cause
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!deleting) return
    setBusy(true)
    setError(null)
    try {
      if (preview) store.removeLocal(deleting.id)
      else await store.remove(deleting.id)
      setDeleting(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '删除失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-label="实验室管理">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#dce6e1] bg-white p-3 shadow-[0_10px_34px_rgb(17_48_38_/_5%)]">
        <label className="min-w-60 flex-1">
          <span className="sr-only">搜索实验室</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索实验室、楼栋、单位或 ID" className={`${inputClass} w-full`} />
        </label>
        <span className="rounded-lg bg-[#edf4f1] px-3 py-2 text-xs font-bold text-[#61736b]">{laboratories.length} 间</span>
        <button type="button" onClick={() => setEditing(null)} className="rounded-xl bg-[#147a56] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgb(20_122_86_/_18%)] active:scale-[.97]">新增实验室</button>
      </div>
      {(error || store.error) && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error ?? store.error}</p>}
      {store.status === 'loading' ? (
        <div className="mt-5 grid min-h-56 place-items-center rounded-2xl border border-[#e0e8e4] bg-white text-sm text-[#73827c]">正在加载实验室…</div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4 max-lg:grid-cols-1">
          {laboratories.map((laboratory) => (
            <article key={laboratory.id} className="rounded-2xl border border-[#dde7e2] bg-white p-5 shadow-[0_7px_24px_rgb(17_48_38_/_4%)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="m-0 truncate text-lg">{laboratory.laboratoryName}</h2>
                  <p className="mt-1 mb-0 truncate text-sm text-[#71827a]">{laboratory.buildingName} · {laboratory.orgName || '未设置单位'}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#e7f4ef] px-2.5 py-1 text-xs font-bold text-[#176c4e]">{laboratory.managers.length} 位负责人</span>
              </div>
              <p className="mt-5 mb-0 truncate font-mono text-[11px] text-[#95a19c]">{laboratory.id}</p>
              <div className="mt-4 flex justify-end gap-2 border-t border-[#e8eeeb] pt-4">
                <button type="button" onClick={() => setEditing(laboratory)} className="rounded-lg bg-[#edf4f1] px-3 py-2 text-xs font-bold text-[#176c4e] active:scale-[.96]">编辑</button>
                <button type="button" onClick={() => setDeleting(laboratory)} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 active:scale-[.96]">删除</button>
              </div>
            </article>
          ))}
        </div>
      )}
      {editing !== undefined && <LaboratoryEditor laboratory={editing} busy={busy} onClose={() => setEditing(undefined)} onSave={save} />}
      {deleting && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-[#092018]/30 p-5 backdrop-blur-[3px]" role="alertdialog" aria-modal="true" aria-label="确认删除实验室">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_24px_80px_rgb(8_39_29_/_25%)]">
            <h2 className="m-0 text-xl">删除“{deleting.laboratoryName}”？</h2>
            <p className="mt-3 text-sm leading-6 text-[#677870]">此操作还会清理实验室授权关系，且无法撤销。</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={busy} onClick={() => setDeleting(null)} className="rounded-xl bg-[#edf3f0] px-4 py-2.5 text-sm font-bold">取消</button>
              <button type="button" disabled={busy} onClick={() => void remove()} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white active:scale-[.97] disabled:opacity-50">{busy ? '正在删除…' : '确认删除'}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
