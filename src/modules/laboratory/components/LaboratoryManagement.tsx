import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { listUsers } from '@/modules/account/api/accounts'
import { getLaboratoryMembers, replaceLaboratoryViewers } from '../api/laboratories'
import { useLaboratoryStore } from '../store/laboratoryStore'
import type {
  Laboratory,
  LaboratoryDraft,
  LaboratoryManager,
  LaboratoryMembers,
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
  listMembers?: (keyword?: string) => Promise<LaboratoryManager[]>
  loadAuthorizationMembers?: (laboratoryId: string) => Promise<LaboratoryMembers>
  saveViewers?: (laboratoryId: string, userIds: string[]) => Promise<LaboratoryMembers>
}

const inputClass = 'h-11 min-w-0 rounded-xl border border-[#d9e4df] bg-white px-3 text-sm text-[#20342c] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#48a17f] focus:shadow-[0_0_0_3px_rgb(72_161_127_/_13%)]'
const MEMBER_SEARCH_DELAY_MS = 250

const toLaboratoryManager = (member: LaboratoryManager): LaboratoryManager => ({
  id: member.id,
  name: member.name,
  username: member.username,
  phone: member.phone,
  email: member.email,
  mark: member.mark,
})

const listLaboratoryMembers = async (keyword?: string) => (
  await listUsers(keyword)
).map(toLaboratoryManager)

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

function EditablePicker({
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  placeholder: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const listboxId = useId()
  const normalizedOptions = useMemo(
    () => [...new Set(options.map((option) => option.trim()).filter(Boolean))]
      .sort((left, right) => left.localeCompare(right, 'zh-CN')),
    [options],
  )
  const query = value.trim().toLocaleLowerCase('zh-CN')
  const filteredOptions = useMemo(
    () => normalizedOptions.filter(
      (option) => !query || option.toLocaleLowerCase('zh-CN').includes(query),
    ),
    [normalizedOptions, query],
  )

  useEffect(() => {
    if (!open) return
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        inputRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOnOutsidePress)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePress)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  useEffect(() => {
    setActiveIndex((current) => (
      filteredOptions.length ? Math.min(Math.max(current, 0), filteredOptions.length - 1) : -1
    ))
  }, [filteredOptions.length])

  const select = (option: string) => {
    onChange(option)
    setOpen(false)
    setActiveIndex(-1)
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }

  const openPicker = () => {
    setOpen(true)
    const selectedIndex = filteredOptions.indexOf(value)
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : filteredOptions.length ? 0 : -1)
  }

  return (
    <div ref={rootRef} className="relative grid min-w-0 gap-1.5">
      <label htmlFor={inputId} className="text-xs font-bold text-[#65766f]">{label}</label>
      <div className={`flex min-w-0 overflow-hidden rounded-xl border bg-white transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none ${
        open
          ? 'border-[#48a17f] shadow-[0_0_0_3px_rgb(72_161_127_/_13%)]'
          : 'border-[#d9e4df] focus-within:border-[#48a17f] focus-within:shadow-[0_0_0_3px_rgb(72_161_127_/_13%)]'
      }`}>
        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={open && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
          value={value}
          placeholder={placeholder}
          onFocus={() => {
            if (normalizedOptions.length) openPicker()
          }}
          onChange={(event) => {
            onChange(event.target.value)
            setOpen(true)
            setActiveIndex(0)
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              if (!open) openPicker()
              else setActiveIndex((current) => Math.min(current + 1, filteredOptions.length - 1))
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              if (!open) openPicker()
              else setActiveIndex((current) => Math.max(current - 1, 0))
            } else if (event.key === 'Enter' && open && activeIndex >= 0) {
              event.preventDefault()
              const option = filteredOptions[activeIndex]
              if (option) select(option)
            } else if (event.key === 'Escape') {
              setOpen(false)
            }
          }}
          className="h-11 min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-[#20342c] outline-none"
        />
        <button
          type="button"
          aria-label={`选择${label}`}
          aria-expanded={open}
          aria-controls={listboxId}
          onClick={() => {
            if (open) setOpen(false)
            else {
              openPicker()
              inputRef.current?.focus()
            }
          }}
          className="group grid w-11 shrink-0 place-items-center border-0 border-l border-[#e0e8e4] bg-[#f7faf8] text-[#65766f] transition-[background-color,transform] duration-150 hover:bg-[#edf5f1] active:scale-[.96] motion-reduce:transition-none"
        >
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className={`size-[18px] fill-none stroke-current stroke-[1.8] transition-transform duration-200 motion-reduce:transition-none ${
              open ? 'rotate-180' : ''
            }`}
          >
            <path d="m6.5 8 3.5 3.5L13.5 8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={`${label}现有选项`}
          className="absolute top-[66px] z-40 w-full origin-top overflow-hidden rounded-[15px] border border-[#cddcd5]/90 bg-white/94 shadow-[0_18px_46px_rgb(16_52_40_/_16%)] backdrop-blur-2xl backdrop-saturate-150 transition duration-200 ease-out starting:-translate-y-1 starting:scale-[.98] starting:opacity-0 motion-reduce:transform-none motion-reduce:transition-none"
        >
          <div className="flex items-center justify-between border-b border-[#e4ebe7] px-3 py-2.5">
            <span className="text-[11px] font-bold text-[#71827a]">选择现有{label}</span>
            <span className="text-[10px] text-[#93a099]">或直接输入新名称</span>
          </div>
          <div className="max-h-56 overflow-y-auto p-1.5">
            {filteredOptions.length ? filteredOptions.map((option, index) => {
              const selected = option === value
              const active = index === activeIndex
              return (
                <button
                  id={`${listboxId}-${index}`}
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onPointerMove={() => setActiveIndex(index)}
                  onClick={() => select(option)}
                  className={`flex min-h-10 w-full min-w-0 items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-sm transition-[background-color,transform] duration-100 active:scale-[.985] motion-reduce:transition-none ${
                    active ? 'bg-[#edf7f3]' : 'hover:bg-[#f5f8f7]'
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate font-semibold text-[#294139]">{option}</span>
                  {selected && (
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#16805a] text-[11px] font-extrabold text-white" aria-hidden="true">✓</span>
                  )}
                </button>
              )
            }) : (
              <div className="px-3 py-5 text-center">
                <p className="m-0 text-xs font-semibold text-[#61736b]">没有匹配的现有选项</p>
                <p className="mt-1 mb-0 text-[10px] text-[#8b9993]">可直接使用当前输入创建新名称</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
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

function memberIdentity(member: LaboratoryManager) {
  return member.id ?? `${member.name}|${member.email ?? ''}|${member.phone ?? ''}`
}

function memberSummary(member: LaboratoryManager) {
  return member.username
    ? `@${member.username}`
    : member.email || member.phone || '未填写联系方式'
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

function LaboratoryMembersDialog({
  laboratory,
  listMembers,
  loadMembers,
  saveViewers,
  onClose,
}: {
  laboratory: Laboratory
  listMembers: (keyword?: string) => Promise<LaboratoryManager[]>
  loadMembers: (laboratoryId: string) => Promise<LaboratoryMembers>
  saveViewers: (laboratoryId: string, userIds: string[]) => Promise<LaboratoryMembers>
  onClose: () => void
}) {
  const [members, setMembers] = useState<LaboratoryMembers>({ owners: [], viewers: [] })
  const [options, setOptions] = useState<LaboratoryManager[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void Promise.all([loadMembers(laboratory.id), listMembers()])
      .then(([loaded, candidates]) => {
        if (!active) return
        setMembers(loaded)
        setSelectedIds(loaded.viewers.flatMap((member) => member.id ? [member.id] : []))
        setOptions(candidates.filter((member) => Boolean(member.id && member.username)))
        setStatus('ready')
      })
      .catch((cause: unknown) => {
        if (!active) return
        setError(cause instanceof Error ? cause.message : '实验室成员加载失败')
        setStatus('error')
      })
    return () => { active = false }
  }, [laboratory.id, listMembers, loadMembers])

  const ownerIds = new Set(members.owners.flatMap((member) => member.id ? [member.id] : []))
  const allCandidates = [...members.viewers, ...options].filter((member, index, values) => (
    member.id && !ownerIds.has(member.id)
      && values.findIndex((candidate) => candidate.id === member.id) === index
  ))
  const query = search.trim().toLowerCase()
  const filteredCandidates = allCandidates.filter((member) => !query || [
    member.name,
    member.username ?? '',
    member.email ?? '',
  ].some((value) => value.toLowerCase().includes(query)))

  const submit = async () => {
    setStatus('saving')
    setError(null)
    try {
      const updated = await saveViewers(laboratory.id, selectedIds)
      setMembers(updated)
      setSelectedIds(updated.viewers.flatMap((member) => member.id ? [member.id] : []))
      setStatus('ready')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '更新实验室可见成员失败')
      setStatus('ready')
    }
  }

  return (
    <div className="fixed inset-0 z-[96] grid place-items-center p-5" role="dialog" aria-modal="true" aria-label={`${laboratory.laboratoryName}成员与授权`}>
      <button type="button" aria-label="关闭成员与授权" onClick={status === 'saving' ? undefined : onClose} className="absolute inset-0 bg-[#092018]/30 backdrop-blur-[3px]" />
      <section className="relative flex max-h-[min(820px,calc(100vh-40px))] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/70 bg-[#f9fbfa]/97 shadow-[0_24px_80px_rgb(8_39_29_/_25%)] backdrop-blur-2xl">
        <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-5">
          <div className="min-w-0">
            <p className="m-0 text-xs font-extrabold tracking-[.12em] text-[#18825c]">MEMBERS & ACCESS</p>
            <h2 className="mt-1 mb-0 truncate text-2xl">{laboratory.laboratoryName}</h2>
            <p className="mt-1 mb-0 text-xs text-[#72827b]">所有者负责授权，可见成员获得实验室数据访问权。</p>
          </div>
          <button type="button" disabled={status === 'saving'} onClick={onClose} className="rounded-xl bg-[#edf3f0] px-3 py-2 text-sm font-bold active:scale-[.97] disabled:opacity-50">关闭</button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-24">
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</p>}
          <section className="rounded-2xl border border-[#dce6e1] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div><h3 className="m-0 text-sm">所有者</h3><p className="mt-1 mb-0 text-xs text-[#819089]">由创建关系确定，当前接口不允许转移或移除。</p></div>
              <span className="rounded-full bg-[#e7f3ed] px-2.5 py-1 text-[10px] font-bold text-[#176c4e]">受保护</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {members.owners.map((owner) => <span key={memberIdentity(owner)} className="rounded-xl bg-[#f0f6f3] px-3 py-2 text-xs font-bold text-[#30483e]">{owner.name}</span>)}
              {status === 'loading' && <span className="text-xs text-[#819089]">正在读取…</span>}
              {status !== 'loading' && members.owners.length === 0 && <span className="text-xs text-[#9a6b43]">未返回所有者</span>}
            </div>
          </section>
          <section className="mt-4 rounded-2xl border border-[#dce6e1] bg-white p-4">
            <div><h3 className="m-0 text-sm">可见成员</h3><p className="mt-1 mb-3 text-xs text-[#819089]">仅展示可登录的系统用户；保存时整体替换直接 viewer，所有者不受影响。</p></div>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索姓名、用户名或邮箱" className={`${inputClass} w-full`} />
            <div className="mt-3 max-h-64 overflow-y-auto rounded-xl bg-[#f7faf8] p-2">
              {filteredCandidates.map((member) => {
                const id = member.id as string
                const checked = selectedIds.includes(id)
                return (
                  <label key={id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 hover:bg-white active:opacity-70">
                    <input aria-label={`可见成员 ${member.name}`} type="checkbox" checked={checked} onChange={() => setSelectedIds(checked ? selectedIds.filter((value) => value !== id) : [...selectedIds, id])} className="size-4 accent-[#16805a]" />
                    <span className="min-w-0 flex-1"><strong className="block truncate text-xs text-[#30483e]">{member.name}</strong><span className="block truncate text-[10px] text-[#819089]">@{member.username}</span></span>
                  </label>
                )
              })}
              {status === 'loading' && <p className="m-0 py-6 text-center text-xs text-[#819089]">正在加载成员…</p>}
              {status !== 'loading' && filteredCandidates.length === 0 && <p className="m-0 py-6 text-center text-xs text-[#819089]">没有匹配的系统用户</p>}
            </div>
          </section>
        </div>
        <footer className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-[#dfe8e3] bg-white/92 px-6 py-4 backdrop-blur-xl">
          <span className="text-xs font-semibold text-[#71827a]">已选择 {selectedIds.length} 位可见成员</span>
          <button type="button" disabled={status !== 'ready'} onClick={() => void submit()} className="rounded-xl bg-[#147a56] px-5 py-2.5 text-sm font-bold text-white active:scale-[.97] disabled:opacity-50">{status === 'saving' ? '正在保存…' : '保存可见成员'}</button>
        </footer>
      </section>
    </div>
  )
}

function LaboratoryEditor({
  laboratory,
  buildingOptions,
  organizationOptions,
  extraColumns,
  listMembers,
  busy,
  onClose,
  onSave,
}: {
  laboratory: Laboratory | null
  buildingOptions: string[]
  organizationOptions: string[]
  extraColumns: LaboratoryExtraColumn[]
  listMembers: (keyword?: string) => Promise<LaboratoryManager[]>
  busy: boolean
  onClose: () => void
  onSave: (draft: LaboratoryDraft) => Promise<void>
}) {
  const [draft, setDraft] = useState(() => laboratory ? draftFrom(laboratory) : emptyDraft())
  const [error, setError] = useState<string | null>(null)
  const [memberPickerOpen, setMemberPickerOpen] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [memberOptions, setMemberOptions] = useState<LaboratoryManager[]>([])
  const [memberStatus, setMemberStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [memberError, setMemberError] = useState<string | null>(null)

  useEffect(() => {
    if (!memberPickerOpen) return
    let active = true
    setMemberStatus('loading')
    setMemberError(null)
    setMemberOptions([])
    const timer = window.setTimeout(() => {
      void listMembers(memberSearch.trim() || undefined)
        .then((members) => {
          if (!active) return
          setMemberOptions(members)
          setMemberStatus('ready')
        })
        .catch((cause: unknown) => {
          if (!active) return
          setMemberStatus('error')
          setMemberError(cause instanceof Error ? cause.message : '成员加载失败')
        })
    }, memberSearch.trim() ? MEMBER_SEARCH_DELAY_MS : 0)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [listMembers, memberPickerOpen, memberSearch])

  const toggleManager = (member: LaboratoryManager) => {
    const identity = memberIdentity(member)
    setDraft((current) => {
      const selected = current.manager.some(
        (candidate) => memberIdentity(candidate) === identity,
      )
      return {
        ...current,
        manager: selected
          ? current.manager.filter((candidate) => memberIdentity(candidate) !== identity)
          : [...current.manager, toLaboratoryManager(member)],
      }
    })
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
              <EditablePicker
                label="楼栋名称"
                value={draft.buildingName}
                options={buildingOptions}
                placeholder="输入或选择楼栋"
                onChange={(buildingName) => setDraft((current) => ({ ...current, buildingName }))}
              />
              <EditablePicker
                label="所属单位"
                value={draft.orgName}
                options={organizationOptions}
                placeholder="输入或选择单位"
                onChange={(orgName) => setDraft((current) => ({ ...current, orgName }))}
              />
            </div>
            <section className="rounded-2xl border border-[#dce6e1] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="m-0 text-sm">负责人</h3>
                  <p className="mt-1 mb-0 text-xs text-[#819089]">从系统用户与联系人中选择，可按姓名、用户名或邮箱搜索。</p>
                </div>
                <button
                  type="button"
                  aria-expanded={memberPickerOpen}
                  onClick={() => setMemberPickerOpen((open) => !open)}
                  className="rounded-lg bg-[#e8f3ee] px-3 py-2 text-xs font-bold text-[#176c4e] active:scale-[.97]"
                >
                  {memberPickerOpen ? '收起' : '选择成员'}
                </button>
              </div>
              <div className="mt-3 grid gap-3">
                {draft.manager.map((manager) => (
                  <div key={memberIdentity(manager)} className="flex min-w-0 items-center gap-3 rounded-xl bg-[#f3f7f5] p-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#dff1e9] text-sm font-extrabold text-[#176c4e]">
                      {manager.name.slice(0, 1)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-2">
                        <strong className="truncate text-sm text-[#294139]">{manager.name}</strong>
                        <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[9px] font-bold text-[#71827a]">
                          {manager.username ? '系统用户' : '联系人'}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-[#819089]">{memberSummary(manager)}</span>
                    </span>
                    <button
                      type="button"
                      aria-label={`移除负责人 ${manager.name}`}
                      onClick={() => toggleManager(manager)}
                      className="rounded-lg px-2.5 py-2 text-xs font-bold text-red-700 hover:bg-red-50 active:scale-[.97]"
                    >
                      移除
                    </button>
                  </div>
                ))}
                {draft.manager.length === 0 && <p className="m-0 py-3 text-center text-xs text-[#8a9792]">尚未添加负责人</p>}
              </div>
              {memberPickerOpen && (
                <div className="mt-3 overflow-hidden rounded-2xl border border-[#dce6e1] bg-[#f8fbf9]">
                  <div className="border-b border-[#dfe8e3] p-3">
                    <label className="relative block">
                      <span className="sr-only">搜索负责人</span>
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 fill-none stroke-[#809089] stroke-2">
                        <circle cx="11" cy="11" r="6" />
                        <path d="m16 16 4 4" strokeLinecap="round" />
                      </svg>
                      <input
                        value={memberSearch}
                        onChange={(event) => setMemberSearch(event.target.value)}
                        placeholder="搜索姓名、用户名或邮箱"
                        className={`${inputClass} w-full pl-9`}
                      />
                    </label>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {memberOptions.map((member) => {
                      const selected = draft.manager.some(
                        (candidate) => memberIdentity(candidate) === memberIdentity(member),
                      )
                      return (
                        <button
                          key={memberIdentity(member)}
                          type="button"
                          aria-label={`${selected ? '取消选择' : '选择'}成员 ${member.name}`}
                          aria-pressed={selected}
                          onClick={() => toggleManager(member)}
                          className={`flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-[background-color,transform] duration-150 active:scale-[.985] motion-reduce:transition-none ${
                            selected ? 'bg-[#e2f2eb]' : 'hover:bg-white'
                          }`}
                        >
                          <span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-extrabold ${
                            selected ? 'bg-[#147a56] text-white' : 'bg-[#e8efec] text-[#5e7168]'
                          }`}>
                            {selected ? '✓' : member.name.slice(0, 1)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex min-w-0 items-center gap-2">
                              <strong className="truncate text-xs text-[#294139]">{member.name}</strong>
                              <span className="shrink-0 text-[9px] font-bold text-[#819089]">
                                {member.username ? '系统用户' : '联系人'}
                              </span>
                            </span>
                            <span className="mt-0.5 block truncate text-[10px] text-[#87958f]">{memberSummary(member)}</span>
                          </span>
                        </button>
                      )
                    })}
                    {memberStatus === 'loading' && <p className="m-0 py-5 text-center text-xs text-[#829089]">正在查询成员…</p>}
                    {memberStatus === 'ready' && memberOptions.length === 0 && <p className="m-0 py-5 text-center text-xs text-[#829089]">没有匹配的成员</p>}
                    {memberStatus === 'error' && <p role="alert" className="m-0 px-3 py-4 text-center text-xs font-semibold text-red-700">{memberError}</p>}
                  </div>
                </div>
              )}
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
  listMembers = listLaboratoryMembers,
  loadAuthorizationMembers = getLaboratoryMembers,
  saveViewers = replaceLaboratoryViewers,
}: LaboratoryManagementProps) {
  const store = useLaboratoryStore()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Laboratory | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Laboratory | null>(null)
  const [managerDetails, setManagerDetails] = useState<{
    laboratory: Laboratory
    manager: LaboratoryManager
  } | null>(null)
  const [authorizationLaboratory, setAuthorizationLaboratory] = useState<Laboratory | null>(null)
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
  const buildingOptions = useMemo(
    () => [...new Set(
      Object.values(store.laboratoriesById)
        .map((laboratory) => laboratory.buildingName.trim())
        .filter(Boolean),
    )],
    [store.laboratoriesById],
  )
  const organizationOptions = useMemo(
    () => [...new Set(
      Object.values(store.laboratoriesById)
        .map((laboratory) => laboratory.orgName?.trim())
        .filter((name): name is string => Boolean(name)),
    )],
    [store.laboratoriesById],
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
                      <button type="button" onClick={() => setAuthorizationLaboratory(laboratory)} className="rounded-lg px-3 py-2 text-xs font-bold text-[#176c4e] hover:bg-[#e9f3ef] active:scale-[.96]">成员与授权</button>
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
      {authorizationLaboratory && (
        <LaboratoryMembersDialog
          laboratory={authorizationLaboratory}
          listMembers={listMembers}
          loadMembers={loadAuthorizationMembers}
          saveViewers={saveViewers}
          onClose={() => setAuthorizationLaboratory(null)}
        />
      )}
      {editing !== undefined && (
        <LaboratoryEditor
          laboratory={editing}
          buildingOptions={buildingOptions}
          organizationOptions={organizationOptions}
          extraColumns={extraColumns}
          listMembers={listMembers}
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
