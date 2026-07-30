import { useState } from 'react'
import type { Laboratory } from '@/modules/laboratory/types'
import { SECTION_SLOTS, sectionsForTime, WEEKDAYS } from '../timetableLayout'
import type { Semester, Timetable, TimetableDraft, WeekType } from '../types'

const inputClass = 'h-11 min-w-0 rounded-xl border border-[#d9e4df] bg-white px-3 text-sm text-[#20342c] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#48a17f] focus:shadow-[0_0_0_3px_rgb(72_161_127_/_13%)]'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid min-w-0 gap-1.5 text-xs font-bold text-[#65766f]">{label}{children}</label>
}

function GroupField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid min-w-0 gap-1.5"><span className="text-xs font-bold text-[#65766f]">{label}</span>{children}</div>
}

const weekTypes: { value: WeekType; label: string; description: string }[] = [
  { value: 'Both', label: '每周', description: '单周和双周都上课' },
  { value: 'Single', label: '单周', description: '仅第 1、3、5…周' },
  { value: 'Double', label: '双周', description: '仅第 2、4、6…周' },
]

function initialDraft(
  timetable: Timetable | null,
  semesterId: string,
  laboratoryId: string,
): TimetableDraft {
  return timetable ? {
    semesterId: timetable.semesterId,
    laboratoryId: timetable.laboratoryId,
    courseName: timetable.courseName,
    teacherName: timetable.teacherName,
    weekType: timetable.weekType,
    startWeek: timetable.startWeek,
    endWeek: timetable.endWeek,
    startSection: timetable.startSection ?? sectionsForTime(timetable.startTime, timetable.endTime).startSection,
    endSection: timetable.endSection ?? sectionsForTime(timetable.startTime, timetable.endTime).endSection,
    startTime: timetable.startTime,
    endTime: timetable.endTime,
    weekday: timetable.weekday,
  } : {
    semesterId,
    laboratoryId,
    courseName: '',
    teacherName: '',
    weekType: 'Both',
    startWeek: 1,
    endWeek: 16,
    startSection: 1,
    endSection: 2,
    startTime: SECTION_SLOTS[0].start,
    endTime: SECTION_SLOTS[1].end,
    weekday: 1,
  }
}

export function TimetableEditor({
  timetable,
  semesters,
  laboratories,
  defaultSemesterId,
  defaultLaboratoryId,
  saving,
  onSave,
  onClose,
}: {
  timetable: Timetable | null
  semesters: Semester[]
  laboratories: Laboratory[]
  defaultSemesterId: string
  defaultLaboratoryId: string
  saving: boolean
  onSave: (draft: TimetableDraft) => Promise<void>
  onClose: () => void
}) {
  const [draft, setDraft] = useState(() => initialDraft(
    timetable,
    defaultSemesterId,
    defaultLaboratoryId,
  ))
  const [error, setError] = useState<string | null>(null)
  const defaultStartTime = SECTION_SLOTS[draft.startSection - 1].start
  const defaultEndTime = SECTION_SLOTS[draft.endSection - 1].end
  const [customStartTime, setCustomStartTime] = useState(
    () => draft.startTime.slice(0, 5) !== defaultStartTime,
  )
  const [customEndTime, setCustomEndTime] = useState(
    () => draft.endTime.slice(0, 5) !== defaultEndTime,
  )
  const usesCustomTime = customStartTime || customEndTime

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!draft.courseName.trim() || !draft.teacherName.trim()) {
      setError('课程名称和教师姓名不能为空')
      return
    }
    if (!draft.semesterId || !draft.laboratoryId) {
      setError('请选择学期和实验室')
      return
    }
    if (draft.startWeek < 1 || draft.endWeek < draft.startWeek) {
      setError('结束周不能早于开始周')
      return
    }
    if (draft.startSection < 1 || draft.endSection < draft.startSection) {
      setError('结束节次不能早于开始节次')
      return
    }
    if (draft.startTime >= draft.endTime) {
      setError('下课时间必须晚于上课时间')
      return
    }
    try {
      await onSave({
        ...draft,
        courseName: draft.courseName.trim(),
        teacherName: draft.teacherName.trim(),
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存排课失败')
    }
  }

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={timetable ? `编辑 ${timetable.courseName}` : '新增排课'}>
      <button type="button" aria-label="关闭排课编辑器" onClick={saving ? undefined : onClose} className="absolute inset-0 bg-[#092018]/30 backdrop-blur-[3px]" />
      <form onSubmit={(event) => void submit(event)} className="absolute inset-y-0 right-0 flex w-full max-w-[620px] flex-col border-l border-white/70 bg-[#f9fbfa]/97 shadow-[-24px_0_70px_rgb(8_39_29_/_22%)] backdrop-blur-2xl">
        <header className="flex items-start justify-between gap-4 px-7 pt-7 pb-5">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-extrabold tracking-[.12em] text-[#18825c]">{timetable ? '课程详情' : '新建课程'}</p>
            <h2 className="m-0 truncate text-2xl">{timetable?.courseName || '安排一门课程'}</h2>
            {timetable && <p className="mt-1 mb-0 truncate font-mono text-[10px] text-[#929f99]">{timetable.id}</p>}
          </div>
          <button type="button" disabled={saving} onClick={onClose} className="rounded-xl bg-[#eaf1ee] px-3 py-2 text-sm font-bold active:scale-[.97] disabled:opacity-50">关闭</button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-28">
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
          <div className="grid gap-5">
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <Field label="学期">
                <select value={draft.semesterId} onChange={(event) => setDraft({ ...draft, semesterId: event.target.value })} className={inputClass}>
                  {semesters.map((semester) => <option key={semester.id} value={semester.id}>{semester.name}</option>)}
                </select>
              </Field>
              <Field label="实验室">
                <select value={draft.laboratoryId} onChange={(event) => setDraft({ ...draft, laboratoryId: event.target.value })} className={inputClass}>
                  {laboratories.map((laboratory) => <option key={laboratory.id} value={laboratory.id}>{laboratory.laboratoryName}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <Field label="课程名称"><input value={draft.courseName} onChange={(event) => setDraft({ ...draft, courseName: event.target.value })} placeholder="例如：操作系统" className={inputClass} /></Field>
              <Field label="教师姓名"><input value={draft.teacherName} onChange={(event) => setDraft({ ...draft, teacherName: event.target.value })} placeholder="例如：张老师" className={inputClass} /></Field>
            </div>
            <GroupField label="上课星期">
              <div className="grid grid-cols-7 gap-1.5 rounded-2xl bg-[#edf3f0] p-1.5">
                {WEEKDAYS.map((weekday, index) => (
                  <button
                    key={weekday}
                    type="button"
                    onClick={() => setDraft({ ...draft, weekday: index + 1 })}
                    className={`min-h-10 rounded-xl px-1 text-xs font-bold transition-[background-color,color,box-shadow,transform] active:scale-[.96] ${draft.weekday === index + 1 ? 'bg-white text-[#147a56] shadow-sm' : 'text-[#687a72]'}`}
                  >
                    {weekday.slice(-1)}
                  </button>
                ))}
              </div>
            </GroupField>
            <div className="grid gap-3 rounded-2xl border border-[#dce7e2] bg-white p-4">
              <div>
                <strong className="block text-sm text-[#294139]">课表位置</strong>
                <span className="mt-0.5 block text-[11px] leading-4 text-[#7b8a84]">用于确定课程在课表中的行位置；选择节次时会带入默认上课时间。</span>
              </div>
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <Field label="开始节次">
                  <select value={draft.startSection} onChange={(event) => {
                  const next = Number(event.target.value)
                    const nextEnd = Math.max(draft.endSection, next)
                    setDraft({
                      ...draft,
                      startSection: next,
                      endSection: nextEnd,
                      startTime: customStartTime ? draft.startTime : SECTION_SLOTS[next - 1].start,
                      endTime: customEndTime || nextEnd === draft.endSection
                        ? draft.endTime
                        : SECTION_SLOTS[nextEnd - 1].end,
                    })
                  }} className={inputClass}>
                    {SECTION_SLOTS.map((slot) => <option key={slot.section} value={slot.section}>第 {slot.section} 节</option>)}
                  </select>
                </Field>
                <Field label="结束节次">
                  <select value={draft.endSection} onChange={(event) => {
                    const next = Number(event.target.value)
                    setDraft({
                      ...draft,
                      endSection: next,
                      endTime: customEndTime ? draft.endTime : SECTION_SLOTS[next - 1].end,
                    })
                  }} className={inputClass}>
                    {SECTION_SLOTS.filter((slot) => slot.section >= draft.startSection).map((slot) => <option key={slot.section} value={slot.section}>第 {slot.section} 节</option>)}
                  </select>
                </Field>
              </div>
            </div>
            <div className={`grid gap-3 rounded-2xl border p-4 transition-[border-color,background-color] duration-150 ${usesCustomTime ? 'border-[#efcf9e] bg-[#fffaf1]' : 'border-[#dce7e2] bg-white'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <strong className="block text-sm text-[#294139]">实际上课时间</strong>
                  <span className="mt-0.5 block text-[11px] leading-4 text-[#7b8a84]">
                    {usesCustomTime ? '已单独调整时间，不会改变课程在课表中的节次位置。' : '当前与所选节次的默认时间一致。'}
                  </span>
                </div>
                {usesCustomTime && (
                  <button
                    type="button"
                    onClick={() => {
                      setDraft({ ...draft, startTime: defaultStartTime, endTime: defaultEndTime })
                      setCustomStartTime(false)
                      setCustomEndTime(false)
                    }}
                    className="shrink-0 rounded-lg bg-[#f3eadb] px-2.5 py-1.5 text-[11px] font-bold text-[#80551f] transition-transform active:scale-[.96]"
                  >
                    恢复默认
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <Field label="上课时间">
                  <input type="time" value={draft.startTime.slice(0, 5)} onChange={(event) => {
                    setCustomStartTime(true)
                    setDraft({ ...draft, startTime: event.target.value })
                  }} className={inputClass} />
                </Field>
                <Field label="下课时间">
                  <input type="time" value={draft.endTime.slice(0, 5)} onChange={(event) => {
                    setCustomEndTime(true)
                    setDraft({ ...draft, endTime: event.target.value })
                  }} className={inputClass} />
                </Field>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="开始周"><input type="number" min={1} max={60} value={draft.startWeek} onChange={(event) => setDraft({ ...draft, startWeek: Number(event.target.value) })} className={inputClass} /></Field>
              <Field label="结束周"><input type="number" min={draft.startWeek} max={60} value={draft.endWeek} onChange={(event) => setDraft({ ...draft, endWeek: Number(event.target.value) })} className={inputClass} /></Field>
            </div>
            <GroupField label="周次类型">
              <div className="grid grid-cols-3 gap-2 max-sm:grid-cols-1">
                {weekTypes.map((weekType) => (
                  <button
                    key={weekType.value}
                    type="button"
                    onClick={() => setDraft({ ...draft, weekType: weekType.value })}
                    className={`rounded-2xl border p-3 text-left transition-[border-color,background-color,transform] active:scale-[.97] ${draft.weekType === weekType.value ? 'border-[#8fc9b2] bg-[#e9f6f1]' : 'border-[#dce6e1] bg-white'}`}
                  >
                    <strong className="block text-sm">{weekType.label}</strong>
                    <span className="mt-1 block text-[10px] text-[#7c8b85]">{weekType.description}</span>
                  </button>
                ))}
              </div>
            </GroupField>
            <div className="rounded-2xl bg-[#edf4f1] px-4 py-3 text-xs leading-5 text-[#61736b]">
              将安排在{WEEKDAYS[draft.weekday - 1]}第 {draft.startSection}{draft.startSection === draft.endSection ? '' : `–${draft.endSection}`} 节，
              实际上课时间为 {draft.startTime.slice(0, 5)}–{draft.endTime.slice(0, 5)}。
            </div>
          </div>
        </div>
        <footer className="absolute inset-x-0 bottom-0 flex justify-end gap-3 border-t border-[#dfe8e3] bg-white/92 px-7 py-4 backdrop-blur-xl">
          <button type="button" disabled={saving} onClick={onClose} className="rounded-xl bg-[#edf3f0] px-5 py-3 text-sm font-bold active:scale-[.97]">取消</button>
          <button type="submit" disabled={saving} className="rounded-xl bg-[#147a56] px-6 py-3 text-sm font-bold text-white active:scale-[.97] disabled:opacity-55">{saving ? '正在保存…' : timetable ? '保存修改' : '创建排课'}</button>
        </footer>
      </form>
    </div>
  )
}
