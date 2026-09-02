import { useEffect, useMemo, useRef, useState } from 'react'
import {
  LaboratoryFilterBar,
  type LaboratoryFilterDataSource,
} from '@/modules/laboratory/components/LaboratoryFilterBar'
import { useLaboratoryFilterStore } from '@/modules/laboratory/store/laboratoryFilterStore'
import { clearTimetables, importTimetables } from '../api/edu'
import { useEduStore } from '../store/eduStore'
import type {
  Semester,
  SemesterDraft,
  Timetable,
  TimetableDraft,
  TimetableImportResult,
} from '../types'
import { SemesterManager } from './SemesterManager'
import { TimetableEditor } from './TimetableEditor'
import { TimetableGrid } from './TimetableGrid'

export interface SchedulingWorkspaceProps {
  preview?: boolean
  filterDataSource?: LaboratoryFilterDataSource
  filterQueryScope?: string
  initiallySelectAllLaboratories?: boolean
}

export function SchedulingWorkspace({
  preview = false,
  filterDataSource,
  filterQueryScope = 'edu-scheduling',
  initiallySelectAllLaboratories = false,
}: SchedulingWorkspaceProps) {
  const semesters = useEduStore((state) => state.semesters)
  const timetablesById = useEduStore((state) => state.timetablesById)
  const semesterStatus = useEduStore((state) => state.semesterStatus)
  const timetableStatus = useEduStore((state) => state.timetableStatus)
  const storeError = useEduStore((state) => state.error)
  const laboratoryIds = useLaboratoryFilterStore((state) => state.laboratoryIds)
  const matchedLaboratories = useLaboratoryFilterStore((state) => state.matchedLaboratories)
  const [semesterId, setSemesterId] = useState('')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Timetable | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Timetable | null>(null)
  const [semesterManagerOpen, setSemesterManagerOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<TimetableImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!initiallySelectAllLaboratories) {
      const filterStore = useLaboratoryFilterStore.getState()
      filterStore.clearFilters()
      filterStore.clearLaboratorySelection()
    }
  }, [initiallySelectAllLaboratories])

  useEffect(() => {
    if (preview || semesterStatus !== 'idle') return
    void useEduStore.getState().loadSemesters().then((items) => {
      if (!semesterId && items[0]) setSemesterId(items[0].id)
    }).catch(() => undefined)
  }, [preview, semesterId, semesterStatus])

  useEffect(() => {
    if (!semesterId && semesters[0]) setSemesterId(semesters[0].id)
  }, [semesterId, semesters])

  useEffect(() => {
    if (preview || !semesterId) return
    if (laboratoryIds.length === 0) {
      useEduStore.getState().clearTimetableView()
      return
    }
    void useEduStore.getState().loadTimetables(semesterId, laboratoryIds).catch(() => undefined)
  }, [laboratoryIds, preview, semesterId])

  const query = search.trim().toLowerCase()
  const timetables = useMemo(() => Object.values(timetablesById)
    .filter((timetable) => timetable.semesterId === semesterId)
    .filter((timetable) => laboratoryIds.includes(timetable.laboratoryId))
    .filter((timetable) => !query || [
      timetable.courseName,
      timetable.teacherName,
      timetable.laboratoryName ?? '',
    ].some((value) => value.toLowerCase().includes(query))), [
    laboratoryIds,
    query,
    semesterId,
    timetablesById,
  ])

  const saveTimetable = async (draft: TimetableDraft) => {
    setBusy(true)
    setError(null)
    try {
      if (preview) {
        const semester = semesters.find((item) => item.id === draft.semesterId)
        const laboratory = matchedLaboratories.find((item) => item.id === draft.laboratoryId)
        if (!semester) throw new Error('预览数据中不存在所选学期')
        useEduStore.getState().upsertTimetableLocal({
          id: editing?.id ?? `preview-timetable-${Date.now()}`,
          ...draft,
          semester,
          laboratoryName: laboratory?.laboratoryName ?? null,
        })
      } else if (editing) {
        await useEduStore.getState().updateTimetable(editing.id, draft)
      } else {
        await useEduStore.getState().createTimetable(draft)
      }
      setEditing(undefined)
    } finally {
      setBusy(false)
    }
  }

  const removeTimetable = async () => {
    if (!deleting) return
    setBusy(true)
    setError(null)
    try {
      if (preview) useEduStore.getState().removeTimetableLocal(deleting.id)
      else await useEduStore.getState().deleteTimetable(deleting.id)
      setDeleting(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '删除排课失败')
    } finally {
      setBusy(false)
    }
  }

  const saveSemester = async (draft: SemesterDraft, semester?: Semester) => {
    setBusy(true)
    try {
      if (preview) {
        const now = new Date().toISOString()
        useEduStore.getState().upsertSemesterLocal({
          id: semester?.id ?? `preview-semester-${Date.now()}`,
          ...draft,
          createAt: semester?.createAt ?? now,
          updateAt: now,
        })
      } else if (semester) {
        await useEduStore.getState().updateSemester(semester.id, draft)
      } else {
        await useEduStore.getState().createSemester(draft)
      }
    } finally {
      setBusy(false)
    }
  }

  const removeSemester = async (semester: Semester) => {
    if (!window.confirm(`删除“${semester.name}”？存在课表时后端会拒绝删除。`)) return
    setBusy(true)
    try {
      if (preview) useEduStore.getState().removeSemesterLocal(semester.id)
      else await useEduStore.getState().deleteSemester(semester.id)
      if (semesterId === semester.id) setSemesterId('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '删除学期失败')
      throw cause
    } finally {
      setBusy(false)
    }
  }

  const handleImport = async (file: File) => {
    if (laboratoryIds.length !== 1) {
      setError('导入前请在实验室筛选中只选择一个目标实验室')
      return
    }
    if (!semesterId) {
      setError('请先选择学期')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const result = await importTimetables(file, semesterId, laboratoryIds[0])
      setImportResult(result)
      await useEduStore.getState().loadTimetables(semesterId, laboratoryIds)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '导入课表失败')
    } finally {
      setBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleClear = async () => {
    if (laboratoryIds.length !== 1 || !semesterId) {
      setError('清空课表前请只选择一个实验室和一个学期')
      return
    }
    const laboratory = matchedLaboratories.find((item) => item.id === laboratoryIds[0])
    if (!window.confirm(`清空“${laboratory?.laboratoryName ?? laboratoryIds[0]}”在当前学期的全部课表？此操作无法撤销。`)) return
    setBusy(true)
    try {
      await clearTimetables(semesterId, laboratoryIds[0])
      await useEduStore.getState().loadTimetables(semesterId, laboratoryIds)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '清空课表失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-label="排课工作区">
      <LaboratoryFilterBar
        dataSource={filterDataSource}
        queryScope={filterQueryScope}
        embedded
        selectAllOnResolve={initiallySelectAllLaboratories}
        selectFirstOnResolve={!initiallySelectAllLaboratories}
      />
      <div className="mt-4 rounded-3xl border border-[#dce6e1] bg-white p-4 shadow-[0_10px_34px_rgb(17_48_38_/_5%)]">
        <div className="flex flex-wrap items-center gap-3">
          <label className="grid min-w-56 gap-1 text-[11px] font-bold text-[#71827a]">
            当前学期
            <select value={semesterId} onChange={(event) => setSemesterId(event.target.value)} className="h-11 rounded-xl border border-[#d9e4df] bg-[#f8fbf9] px-3 text-sm font-bold text-[#20342c] outline-none focus:border-[#48a17f]">
              {!semesters.length && <option value="">暂无学期</option>}
              {semesters.map((semester) => <option key={semester.id} value={semester.id}>{semester.name}</option>)}
            </select>
          </label>
          <label className="mt-auto min-w-56 flex-1">
            <span className="sr-only">搜索课程</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索课程、教师或实验室" className="h-11 w-full rounded-xl border border-[#d9e4df] bg-[#f8fbf9] px-3 text-sm outline-none focus:border-[#48a17f]" />
          </label>
          <div className="mt-auto flex flex-wrap gap-2">
            <button type="button" onClick={() => setSemesterManagerOpen(true)} className="rounded-xl bg-[#edf3f0] px-3.5 py-3 text-xs font-bold text-[#315046] active:scale-[.97]">管理学期</button>
            {!preview && <>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void handleImport(file)
              }} />
              <button type="button" disabled={busy} onClick={() => fileInputRef.current?.click()} className="rounded-xl bg-[#edf3f0] px-3.5 py-3 text-xs font-bold text-[#315046] active:scale-[.97] disabled:opacity-50">导入 Excel</button>
              <button type="button" disabled={busy} onClick={() => void handleClear()} className="rounded-xl px-3.5 py-3 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">清空课表</button>
            </>}
            <button type="button" disabled={!semesterId || !matchedLaboratories.length} onClick={() => setEditing(null)} className="rounded-xl bg-[#147a56] px-4 py-3 text-xs font-bold text-white shadow-[0_8px_20px_rgb(20_122_86_/_18%)] active:scale-[.97] disabled:opacity-45">新增排课</button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#71827a]">
          <span className="rounded-full bg-[#edf4f1] px-2.5 py-1 font-bold">{timetables.length} 条课程</span>
          <span>{laboratoryIds.length} 间实验室在当前范围</span>
          {semesterStatus === 'loading' && <span>正在加载学期…</span>}
        </div>
      </div>
      {(error || storeError) && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error ?? storeError}</p>}
      <div className="relative mt-4">
        <TimetableGrid
          timetables={timetables}
          laboratories={matchedLaboratories.filter((laboratory) => laboratoryIds.includes(laboratory.id))}
          loading={timetableStatus === 'loading'}
          onOpen={(timetable) => setEditing(timetable)}
          onDelete={(timetable) => setDeleting(timetable)}
        />
      </div>
      {editing !== undefined && (
        <TimetableEditor
          timetable={editing}
          semesters={semesters}
          laboratories={matchedLaboratories}
          defaultSemesterId={semesterId}
          defaultLaboratoryId={laboratoryIds[0] ?? matchedLaboratories[0]?.id ?? ''}
          saving={busy}
          onSave={saveTimetable}
          onClose={() => setEditing(undefined)}
        />
      )}
      {semesterManagerOpen && (
        <SemesterManager
          semesters={semesters}
          busy={busy}
          onCreate={(draft) => saveSemester(draft)}
          onUpdate={(id, draft) => saveSemester(draft, semesters.find((item) => item.id === id))}
          onDelete={removeSemester}
          onClose={() => setSemesterManagerOpen(false)}
        />
      )}
      {deleting && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-[#092018]/30 p-5 backdrop-blur-[3px]" role="alertdialog" aria-modal="true" aria-label="确认删除排课">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_24px_80px_rgb(8_39_29_/_25%)]">
            <h2 className="m-0 text-xl">删除“{deleting.courseName}”？</h2>
            <p className="mt-3 text-sm leading-6 text-[#677870]">{deleting.teacherName} · {deleting.startWeek}–{deleting.endWeek} 周。删除后无法恢复。</p>
            <div className="mt-6 flex justify-end gap-3"><button type="button" disabled={busy} onClick={() => setDeleting(null)} className="rounded-xl bg-[#edf3f0] px-4 py-2.5 text-sm font-bold">取消</button><button type="button" disabled={busy} onClick={() => void removeTimetable()} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white active:scale-[.97] disabled:opacity-50">{busy ? '正在删除…' : '确认删除'}</button></div>
          </div>
        </div>
      )}
      {importResult && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-[#092018]/30 p-5 backdrop-blur-[3px]" role="dialog" aria-modal="true" aria-label="课表导入结果">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-[0_24px_80px_rgb(8_39_29_/_25%)]">
            <h2 className="m-0 text-xl">导入完成</h2>
            <p className="mt-2 text-sm text-[#677870]">成功 {importResult.ok} 条，失败 {importResult.fail} 条。</p>
            {importResult.errors.length > 0 && <div className="mt-4 max-h-56 overflow-y-auto rounded-xl bg-red-50 p-3">{importResult.errors.map((item, index) => <p key={`${item.rowIndex}-${item.columnIndex}-${index}`} className="m-0 border-b border-red-100 py-2 text-xs text-red-800 last:border-0">第 {item.rowIndex + 1} 行，第 {item.columnIndex + 1} 列：{item.reason}</p>)}</div>}
            <div className="mt-5 flex justify-end"><button type="button" onClick={() => setImportResult(null)} className="rounded-xl bg-[#147a56] px-4 py-2.5 text-sm font-bold text-white">完成</button></div>
          </div>
        </div>
      )}
    </section>
  )
}
