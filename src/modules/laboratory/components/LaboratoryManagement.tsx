import { useEffect, useMemo, useState } from 'react'
import { useLaboratoryStore } from '../store/laboratoryStore'
import type {
  Laboratory,
  LaboratoryDraft,
  LaboratoryManager,
} from '../types'

export interface LaboratoryExtraColumn {
  key: string
  label: string
  className?: string
  emptyText?: string
  render?: (value: unknown, laboratory: Laboratory) => React.ReactNode
  input?: {
    type?: 'text' | 'number' | 'select' | 'boolean' | 'textarea'
    placeholder?: string
    description?: string
    unit?: string
    required?: boolean
    min?: number
    max?: number
    step?: number
    span?: 1 | 2
    options?: Array<{
      label: string
      value: string | number
    }>
  }
}

export interface LaboratoryManagementProps {
  preview?: boolean
  extraColumns?: LaboratoryExtraColumn[]
}

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

function readExtraValue(extra: Laboratory['extra'], path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
    return (value as Record<string, unknown>)[key]
  }, extra)
}

function writeExtraValue(
  extra: Laboratory['extra'],
  path: string,
  value: unknown,
): Laboratory['extra'] {
  const keys = path.split('.').filter(Boolean)
  if (!keys.length) return extra
  const removeValue = value === undefined || value === null || value === ''

  const update = (
    source: Record<string, unknown>,
    index: number,
  ): Record<string, unknown> => {
    const key = keys[index]
    const next = { ...source }
    if (index === keys.length - 1) {
      if (removeValue) delete next[key]
      else next[key] = value
      return next
    }
    const currentChild = source[key]
    const child = currentChild && typeof currentChild === 'object' && !Array.isArray(currentChild)
      ? currentChild as Record<string, unknown>
      : {}
    const nextChild = update(child, index + 1)
    if (Object.keys(nextChild).length) next[key] = nextChild
    else delete next[key]
    return next
  }

  const root = update(extra ?? {}, 0)
  return Object.keys(root).length ? root : null
}

function formatExtraValue(value: unknown, emptyText = '—') {
  if (value === null || value === undefined || value === '') return emptyText
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (Array.isArray(value)) return value.map(String).join('、') || emptyText
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function ManagerDetailsDialog({
  laboratory,
  manager,
  onClose,
}: {
  laboratory: Laboratory
  manager: LaboratoryManager
  onClose: () => void
}) {
  const details = [
    ['姓名', manager.name],
    ['用户名', manager.username],
    ['手机', manager.phone],
    ['邮箱', manager.email],
    ['备注', manager.mark],
    ['用户 ID', manager.id],
  ].filter((detail): detail is [string, string] => Boolean(detail[1]))

  return (
    <div className="fixed inset-0 z-[95] grid place-items-center p-5" role="dialog" aria-modal="true" aria-label={`${manager.name}的负责人详情`}>
      <button type="button" aria-label="关闭负责人详情" onClick={onClose} className="absolute inset-0 bg-[#092018]/30 backdrop-blur-[3px]" />
      <section className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-[0_24px_80px_rgb(8_39_29_/_25%)] backdrop-blur-2xl">
        <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-5">
          <div className="min-w-0">
            <p className="m-0 text-xs font-extrabold tracking-[.12em] text-[#18825c]">实验室负责人</p>
            <h2 className="mt-1 mb-0 truncate text-2xl">{manager.name}</h2>
            <p className="mt-1 mb-0 truncate text-sm text-[#72827b]">{laboratory.laboratoryName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl bg-[#edf3f0] px-3 py-2 text-sm font-bold active:scale-[.97]">关闭</button>
        </header>
        <dl className="m-0 grid gap-px border-t border-[#e5ece8] bg-[#e5ece8]">
          {details.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 bg-white px-6 py-3.5">
              <dt className="text-sm font-semibold text-[#7b8983]">{label}</dt>
              <dd className="m-0 break-words text-sm font-semibold text-[#20342c]">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}

function LaboratoryEditor({
  laboratory,
  extraColumns,
  busy,
  onClose,
  onSave,
}: {
  laboratory: Laboratory | null
  extraColumns: LaboratoryExtraColumn[]
  busy: boolean
  onClose: () => void
  onSave: (draft: LaboratoryDraft) => Promise<void>
}) {
  const [draft, setDraft] = useState(() => laboratory ? draftFrom(laboratory) : emptyDraft())
  const [error, setError] = useState<string | null>(null)

  const updateManager = (index: number, patch: Partial<LaboratoryManager>) => {
    setDraft((current) => ({
      ...current,
      manager: current.manager.map((manager, managerIndex) => managerIndex === index
        ? { ...manager, ...patch }
        : manager),
    }))
  }

  const updateExtra = (path: string, value: unknown) => {
    setDraft((current) => ({
      ...current,
      extra: writeExtraValue(current.extra, path, value),
    }))
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!draft.laboratoryName.trim() || !draft.buildingName.trim()) {
      setError('实验室名称和楼栋名称不能为空')
      return
    }
    const missingExtra = extraColumns.find((column) => {
      if (!column.input?.required) return false
      const value = readExtraValue(draft.extra, column.key)
      return value === undefined || value === null || value === ''
    })
    if (missingExtra) {
      setError(`请填写${missingExtra.label}`)
      return
    }
    try {
      await onSave({
        ...draft,
        laboratoryName: draft.laboratoryName.trim(),
        buildingName: draft.buildingName.trim(),
        orgName: draft.orgName.trim(),
        manager: draft.manager.filter((manager) => manager.name.trim()),
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存失败')
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
            {extraColumns.length > 0 && (
              <section className="rounded-2xl border border-[#dce6e1] bg-white p-4">
                <div>
                  <h3 className="m-0 text-sm">扩展资料</h3>
                  <p className="mt-1 mb-0 text-xs leading-5 text-[#819089]">
                    这里填写的内容会同步显示在实验室列表对应列中。
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  {extraColumns.map((column) => {
                    const config = column.input ?? {}
                    const type = config.type ?? 'text'
                    const value = readExtraValue(draft.extra, column.key)
                    const fieldClassName = config.span === 2 ? 'col-span-2 max-sm:col-span-1' : ''

                    if (type === 'boolean') {
                      return (
                        <fieldset key={column.key} className={`m-0 min-w-0 border-0 p-0 ${fieldClassName}`}>
                          <legend className="mb-1.5 text-xs font-bold text-[#65766f]">
                            {column.label}{config.required ? ' *' : ''}
                          </legend>
                          <div className="grid grid-cols-3 rounded-xl border border-[#d9e4df] bg-[#eef4f1] p-1">
                            {[
                              { label: '未设置', value: undefined },
                              { label: '是', value: true },
                              { label: '否', value: false },
                            ].map((option) => {
                              const selected = value === option.value
                              return (
                                <button
                                  key={option.label}
                                  type="button"
                                  aria-pressed={selected}
                                  onClick={() => updateExtra(column.key, option.value)}
                                  className={`h-9 rounded-lg text-xs font-bold transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[.97] motion-reduce:transition-none ${
                                    selected
                                      ? 'bg-white text-[#176c4e] shadow-[0_2px_8px_rgb(21_70_53_/_10%)]'
                                      : 'text-[#708078] hover:text-[#30483e]'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              )
                            })}
                          </div>
                          {config.description && <p className="mt-1.5 mb-0 text-[11px] leading-4 text-[#8a9892]">{config.description}</p>}
                        </fieldset>
                      )
                    }

                    if (type === 'select') {
                      return (
                        <div key={column.key} className={fieldClassName}>
                          <Field label={`${column.label}${config.required ? ' *' : ''}`}>
                            <select
                              aria-label={column.label}
                              value={value === undefined || value === null ? '' : String(value)}
                              onChange={(event) => {
                                const selected = config.options?.find(
                                  (option) => String(option.value) === event.target.value,
                                )
                                updateExtra(column.key, selected?.value)
                              }}
                              className={inputClass}
                            >
                              <option value="">{config.placeholder ?? '请选择'}</option>
                              {config.options?.map((option) => (
                                <option key={String(option.value)} value={String(option.value)}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </Field>
                          {config.description && <p className="mt-1.5 mb-0 text-[11px] leading-4 text-[#8a9892]">{config.description}</p>}
                        </div>
                      )
                    }

                    const control = type === 'textarea' ? (
                      <textarea
                        aria-label={column.label}
                        value={typeof value === 'string' ? value : ''}
                        onChange={(event) => updateExtra(column.key, event.target.value)}
                        rows={3}
                        placeholder={config.placeholder}
                        className={`${inputClass} h-auto resize-y py-3 leading-5`}
                      />
                    ) : (
                      <div className="relative">
                        <input
                          aria-label={column.label}
                          type={type}
                          value={typeof value === 'string' || typeof value === 'number' ? value : ''}
                          min={config.min}
                          max={config.max}
                          step={config.step}
                          placeholder={config.placeholder}
                          onChange={(event) => updateExtra(
                            column.key,
                            type === 'number'
                              ? event.target.value === '' ? undefined : Number(event.target.value)
                              : event.target.value,
                          )}
                          className={`${inputClass} w-full ${config.unit ? 'pr-12' : ''}`}
                        />
                        {config.unit && (
                          <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs font-bold text-[#829089]">
                            {config.unit}
                          </span>
                        )}
                      </div>
                    )

                    return (
                      <div key={column.key} className={fieldClassName}>
                        <Field label={`${column.label}${config.required ? ' *' : ''}`}>{control}</Field>
                        {config.description && <p className="mt-1.5 mb-0 text-[11px] leading-4 text-[#8a9892]">{config.description}</p>}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
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

export function LaboratoryManagement({
  preview = false,
  extraColumns = [],
}: LaboratoryManagementProps) {
  const store = useLaboratoryStore()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Laboratory | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Laboratory | null>(null)
  const [managerDetails, setManagerDetails] = useState<{
    laboratory: Laboratory
    manager: LaboratoryManager
  } | null>(null)
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
        <div className="mt-5 overflow-hidden rounded-2xl border border-[#dce6e1] bg-white shadow-[0_10px_34px_rgb(17_48_38_/_5%)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left">
              <thead className="bg-[#f2f7f5] text-xs font-bold text-[#66776f]">
                <tr>
                  <th scope="col" className="px-5 py-3.5">实验室</th>
                  <th scope="col" className="px-4 py-3.5">楼栋</th>
                  <th scope="col" className="px-4 py-3.5">所属单位</th>
                  <th scope="col" className="px-4 py-3.5">负责人</th>
                  {extraColumns.map((column) => (
                    <th key={column.key} scope="col" className={`px-4 py-3.5 ${column.className ?? ''}`}>{column.label}</th>
                  ))}
                  <th scope="col" className="px-4 py-3.5">更新时间</th>
                  <th scope="col" className="sticky right-0 bg-[#f2f7f5] px-5 py-3.5 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {laboratories.map((laboratory) => (
                  <tr key={laboratory.id} className="group border-t border-[#e5ece8] transition-colors hover:bg-[#f8fbf9]">
                    <td className="max-w-72 px-5 py-4">
                      <p className="m-0 truncate text-sm font-bold text-[#183128]" title={laboratory.laboratoryName}>{laboratory.laboratoryName}</p>
                      <p className="mt-1 mb-0 truncate font-mono text-[10px] text-[#98a49f]" title={laboratory.id}>{laboratory.id}</p>
                    </td>
                    <td className="max-w-44 px-4 py-4 text-sm font-semibold text-[#41564d]"><span className="block truncate" title={laboratory.buildingName}>{laboratory.buildingName}</span></td>
                    <td className="max-w-52 px-4 py-4 text-sm text-[#566960]"><span className="block truncate" title={laboratory.orgName ?? undefined}>{laboratory.orgName || '—'}</span></td>
                    <td className="max-w-64 px-4 py-4">
                      {laboratory.managers.length ? (
                        <div className="flex flex-wrap gap-x-2 gap-y-1">
                          {laboratory.managers.map((manager, index) => (
                            <button
                              key={manager.id ?? `${manager.name}-${index}`}
                              type="button"
                              onClick={() => setManagerDetails({ laboratory, manager })}
                              className="max-w-32 truncate rounded-md text-left text-sm font-bold text-[#147a56] underline decoration-[#9fcdbb] underline-offset-4 hover:text-[#0d6042] active:scale-[.97]"
                              title={`查看 ${manager.name} 的详情`}
                            >
                              {manager.name}
                            </button>
                          ))}
                        </div>
                      ) : <span className="text-sm text-[#97a39e]">未设置</span>}
                    </td>
                    {extraColumns.map((column) => {
                      const value = readExtraValue(laboratory.extra, column.key)
                      return (
                        <td key={column.key} className={`max-w-56 px-4 py-4 text-sm text-[#41564d] ${column.className ?? ''}`}>
                          <span className="block truncate" title={typeof value === 'string' || typeof value === 'number' ? String(value) : undefined}>
                            {column.render ? column.render(value, laboratory) : formatExtraValue(value, column.emptyText)}
                          </span>
                        </td>
                      )
                    })}
                    <td className="whitespace-nowrap px-4 py-4 text-xs text-[#77867f]">{new Date(laboratory.updateAt).toLocaleDateString('zh-CN')}</td>
                    <td className="sticky right-0 whitespace-nowrap bg-white px-5 py-4 text-right transition-colors group-hover:bg-[#f8fbf9]">
                      <button type="button" onClick={() => setEditing(laboratory)} className="rounded-lg px-3 py-2 text-xs font-bold text-[#176c4e] hover:bg-[#e9f3ef] active:scale-[.96]">编辑</button>
                      <button type="button" onClick={() => setDeleting(laboratory)} className="rounded-lg px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 active:scale-[.96]">删除</button>
                    </td>
                  </tr>
                ))}
                {laboratories.length === 0 && (
                  <tr>
                    <td colSpan={6 + extraColumns.length} className="px-5 py-16 text-center text-sm text-[#87958f]">没有符合条件的实验室</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {managerDetails && (
        <ManagerDetailsDialog
          laboratory={managerDetails.laboratory}
          manager={managerDetails.manager}
          onClose={() => setManagerDetails(null)}
        />
      )}
      {editing !== undefined && (
        <LaboratoryEditor
          laboratory={editing}
          extraColumns={extraColumns}
          busy={busy}
          onClose={() => setEditing(undefined)}
          onSave={save}
        />
      )}
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
