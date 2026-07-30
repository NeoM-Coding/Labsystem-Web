import { useState } from 'react'
import type { Semester, SemesterDraft } from '../types'

const inputClass = 'h-11 min-w-0 rounded-xl border border-[#d9e4df] bg-white px-3 text-sm text-[#20342c] outline-none focus:border-[#48a17f] focus:shadow-[0_0_0_3px_rgb(72_161_127_/_13%)]'

const emptyDraft = (): SemesterDraft => ({ name: '', startDate: '', endDate: '' })

export function SemesterManager({
  semesters,
  busy,
  onCreate,
  onUpdate,
  onDelete,
  onClose,
}: {
  semesters: Semester[]
  busy: boolean
  onCreate: (draft: SemesterDraft) => Promise<void>
  onUpdate: (semesterId: string, draft: SemesterDraft) => Promise<void>
  onDelete: (semester: Semester) => Promise<void>
  onClose: () => void
}) {
  const [editing, setEditing] = useState<Semester | null>(null)
  const [draft, setDraft] = useState<SemesterDraft>(emptyDraft)
  const [error, setError] = useState<string | null>(null)

  const begin = (semester?: Semester) => {
    setEditing(semester ?? null)
    setDraft(semester ? {
      name: semester.name,
      startDate: semester.startDate,
      endDate: semester.endDate,
    } : emptyDraft())
    setError(null)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!/^\d{4}-\d{4} 第\d+学期$/.test(draft.name.trim())) {
      setError('学期名称格式应为“2026-2027 第1学期”')
      return
    }
    if (!draft.startDate || !draft.endDate || draft.startDate >= draft.endDate) {
      setError('开始日期必须早于结束日期')
      return
    }
    try {
      if (editing) await onUpdate(editing.id, draft)
      else await onCreate(draft)
      setDraft(emptyDraft())
      setEditing(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存学期失败')
    }
  }

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="学期管理">
      <button type="button" aria-label="关闭学期管理" onClick={busy ? undefined : onClose} className="absolute inset-0 bg-[#092018]/30 backdrop-blur-[3px]" />
      <section className="absolute inset-y-0 right-0 flex w-full max-w-[680px] flex-col border-l border-white/70 bg-[#f9fbfa]/97 shadow-[-24px_0_70px_rgb(8_39_29_/_22%)] backdrop-blur-2xl">
        <header className="flex items-start justify-between gap-4 px-7 pt-7 pb-5">
          <div><p className="mb-1 text-xs font-extrabold tracking-[.12em] text-[#18825c]">SEMESTER</p><h2 className="m-0 text-2xl">学期管理</h2></div>
          <button type="button" onClick={onClose} className="rounded-xl bg-[#eaf1ee] px-3 py-2 text-sm font-bold active:scale-[.97]">关闭</button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-7">
          <form onSubmit={(event) => void submit(event)} className="rounded-2xl border border-[#dce6e1] bg-white p-4">
            <div className="mb-3 flex items-center justify-between"><strong className="text-sm">{editing ? '修改学期' : '新增学期'}</strong>{editing && <button type="button" onClick={() => begin()} className="text-xs font-bold text-[#147a56]">改为新增</button>}</div>
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>}
            <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
              <input aria-label="学期名称" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="2026-2027 第1学期" className={inputClass} />
              <input aria-label="开始日期" type="date" value={draft.startDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} className={inputClass} />
              <input aria-label="结束日期" type="date" value={draft.endDate} onChange={(event) => setDraft({ ...draft, endDate: event.target.value })} className={inputClass} />
            </div>
            <div className="mt-3 flex justify-end"><button type="submit" disabled={busy} className="rounded-xl bg-[#147a56] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{busy ? '保存中…' : editing ? '保存修改' : '创建学期'}</button></div>
          </form>
          <div className="mt-4 overflow-hidden rounded-2xl border border-[#dce6e1] bg-white">
            {semesters.map((semester) => (
              <div key={semester.id} className="flex items-center justify-between gap-4 border-b border-[#e5ece8] px-4 py-3 last:border-b-0">
                <div className="min-w-0"><strong className="block truncate text-sm">{semester.name}</strong><span className="mt-1 block text-xs text-[#7b8a84]">{semester.startDate} 至 {semester.endDate}</span></div>
                <div className="shrink-0"><button type="button" onClick={() => begin(semester)} className="rounded-lg px-3 py-2 text-xs font-bold text-[#147a56] hover:bg-[#edf4f1]">编辑</button><button type="button" onClick={() => void onDelete(semester).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : '删除学期失败'))} className="rounded-lg px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50">删除</button></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
