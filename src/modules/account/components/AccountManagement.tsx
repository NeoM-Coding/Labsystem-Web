import { useEffect, useMemo, useRef, useState } from 'react'
import { getLaboratories } from '@/modules/laboratory/api/laboratories'
import type { Laboratory } from '@/modules/laboratory/types'
import {
  createContact,
  createUser,
  listUserPermissions,
  listUsers,
  updateUser,
} from '../api/accounts'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { defaultPermissionTree } from '../permissionCatalog'
import { useAccountStore } from '../store/accountStore'
import type {
  AppRelation,
  ContactCreateDraft,
  ManagedUser,
  PermissionTreeNode,
  UserCreateDraft,
  UserUpdateDraft,
} from '../types'

export interface AccountManagementDataSource {
  listUsers: (keyword?: string) => Promise<ManagedUser[]>
  listUserPermissions: (userId: string) => Promise<string[]>
  listLaboratories: () => Promise<Laboratory[]>
  createUser: (draft: UserCreateDraft) => Promise<ManagedUser>
  updateUser: (userId: string, draft: UserUpdateDraft) => Promise<ManagedUser>
  createContact: (draft: ContactCreateDraft) => Promise<ManagedUser>
}

export interface AccountManagementProps {
  dataSource?: AccountManagementDataSource
  permissionTree?: PermissionTreeNode[]
  operatorUserId?: string
}

const accountManagementDataSource: AccountManagementDataSource = {
  listUsers,
  listUserPermissions,
  listLaboratories: () => getLaboratories([], []),
  createUser,
  updateUser,
  createContact,
}

const inputClass = 'h-11 min-w-0 rounded-xl border border-[#d9e4df] bg-white px-3 text-sm text-[#20342c] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#48a17f] focus:shadow-[0_0_0_3px_rgb(72_161_127_/_13%)]'

const emptyUser = (): UserCreateDraft => ({
  name: '',
  username: '',
  password: '',
  phone: '',
  email: '',
  mark: '',
  appRelations: [],
  laboratoryIds: [],
})

const emptyContact = (): ContactCreateDraft => ({
  name: '',
  phone: '',
  email: '',
  mark: '',
})

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid min-w-0 gap-1.5 text-xs font-bold text-[#65766f]">
      {label}
      {children}
    </label>
  )
}

function relationsOf(node: PermissionTreeNode): AppRelation[] {
  return [
    ...(node.relation ? [node.relation] : []),
    ...(node.children?.flatMap(relationsOf) ?? []),
  ]
}

function SelectionCheckbox({
  label,
  checked,
  mixed = false,
  onChange,
  disabled = false,
}: {
  label: string
  checked: boolean
  mixed?: boolean
  onChange: () => void
  disabled?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = mixed
  }, [mixed])

  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="size-4 shrink-0 accent-[#16805a] disabled:cursor-not-allowed disabled:opacity-45"
    />
  )
}

function PermissionTreeItem({
  node,
  depth,
  selected,
  onChange,
  editable,
}: {
  node: PermissionTreeNode
  depth: number
  selected: AppRelation[]
  onChange: (relations: AppRelation[]) => void
  editable: ReadonlySet<AppRelation>
}) {
  const [expanded, setExpanded] = useState(true)
  const relations = relationsOf(node)
  const selectedCount = relations.filter((relation) => selected.includes(relation)).length
  const checked = relations.length > 0 && selectedCount === relations.length
  const mixed = selectedCount > 0 && !checked
  const hasChildren = Boolean(node.children?.length)
  const editableNodeRelations = relations.filter((relation) => editable.has(relation))
  const locked = editableNodeRelations.length === 0

  const toggleSelection = () => {
    const relationSet = new Set(selected)
    if (editableNodeRelations.every((relation) => relationSet.has(relation))) {
      editableNodeRelations.forEach((relation) => relationSet.delete(relation))
    } else {
      editableNodeRelations.forEach((relation) => relationSet.add(relation))
    }
    onChange([...relationSet])
  }

  return (
    <li>
      <div
        className={`group flex min-h-10 items-center gap-2 rounded-xl pr-2 transition-colors ${locked ? 'text-[#98a49f]' : 'hover:bg-[#f0f6f3]'} ${depth === 0 ? 'mt-1 bg-[#f7faf8]' : ''}`}
        style={{ paddingLeft: `${8 + depth * 22}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={`${expanded ? '收起' : '展开'}${node.label}`}
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            className="grid size-7 shrink-0 place-items-center rounded-lg text-[#70827a] transition-colors hover:bg-[#e3eee9] active:scale-[.94]"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className={`size-4 fill-none stroke-current stroke-[1.8] transition-transform duration-200 motion-reduce:transition-none ${expanded ? 'rotate-90' : ''}`}>
              <path d="m8 6 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : <span className="size-7 shrink-0" aria-hidden="true" />}
        <SelectionCheckbox
          label={`选择${node.label}`}
          checked={checked}
          mixed={mixed}
          onChange={toggleSelection}
          disabled={locked}
        />
        <button
          type="button"
          onClick={hasChildren ? () => setExpanded((value) => !value) : locked ? undefined : toggleSelection}
          className={`min-w-0 flex-1 py-2 text-left ${locked ? 'cursor-not-allowed' : 'active:opacity-70'}`}
        >
          <span className="block truncate text-xs font-bold text-[#30483e]">{node.label}</span>
          {node.description && <span className="mt-0.5 block truncate text-[10px] text-[#85928d]">{node.description}</span>}
          {node.relation && locked && <span className="mt-0.5 block text-[10px] font-semibold text-[#9b7a45]">你没有此权限，无法转授</span>}
        </button>
        {hasChildren && (
          <span className="shrink-0 rounded-full bg-[#e6f1ec] px-2 py-0.5 text-[10px] font-bold text-[#527066]">
            {selectedCount}/{relations.length}
          </span>
        )}
      </div>
      {hasChildren && expanded && (
        <ul className="m-0 list-none p-0">
          {node.children?.map((child) => (
            <PermissionTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selected={selected}
              onChange={onChange}
              editable={editable}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export function PermissionTree({
  nodes,
  selected,
  onChange,
  editable,
}: {
  nodes: PermissionTreeNode[]
  selected: AppRelation[]
  onChange: (relations: AppRelation[]) => void
  editable: ReadonlySet<AppRelation>
}) {
  return (
    <div className="max-h-[360px] overflow-y-auto rounded-2xl border border-[#dce6e1] bg-white p-2">
      <ul className="m-0 list-none p-0">
        {nodes.map((node) => (
          <PermissionTreeItem
            key={node.id}
            node={node}
            depth={0}
            selected={selected}
            onChange={onChange}
            editable={editable}
          />
        ))}
      </ul>
    </div>
  )
}

function LaboratoryScopePicker({
  laboratories,
  selected,
  onChange,
}: {
  laboratories: Laboratory[]
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const groups = useMemo(() => {
    const result = new Map<string, Laboratory[]>()
    laboratories.forEach((laboratory) => {
      const key = `${laboratory.buildingName} · ${laboratory.orgName || '未设置单位'}`
      result.set(key, [...(result.get(key) ?? []), laboratory])
    })
    return [...result.entries()]
  }, [laboratories])

  return (
    <div className="max-h-[360px] overflow-y-auto rounded-2xl border border-[#dce6e1] bg-white p-2">
      {groups.map(([group, items]) => {
        const selectedCount = items.filter((item) => selected.includes(item.id)).length
        const checked = selectedCount === items.length
        return (
          <div key={group} className="mb-1 last:mb-0">
            <label className="flex min-h-10 items-center gap-2 rounded-xl bg-[#f7faf8] px-3 hover:bg-[#f0f6f3]">
              <SelectionCheckbox
                label={`选择${group}`}
                checked={checked}
                mixed={selectedCount > 0 && !checked}
                onChange={() => {
                  const ids = new Set(selected)
                  if (checked) items.forEach((item) => ids.delete(item.id))
                  else items.forEach((item) => ids.add(item.id))
                  onChange([...ids])
                }}
              />
              <span className="min-w-0 flex-1 truncate text-xs font-bold text-[#30483e]">{group}</span>
              <span className="rounded-full bg-[#e6f1ec] px-2 py-0.5 text-[10px] font-bold text-[#527066]">{selectedCount}/{items.length}</span>
            </label>
            <div className="ml-5 border-l border-[#dfe8e3] pl-3">
              {items.map((laboratory) => (
                <label key={laboratory.id} className="flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs hover:bg-[#f0f6f3]">
                  <input
                    type="checkbox"
                    checked={selected.includes(laboratory.id)}
                    onChange={() => onChange(selected.includes(laboratory.id)
                      ? selected.filter((id) => id !== laboratory.id)
                      : [...selected, laboratory.id])}
                    className="size-4 accent-[#16805a]"
                  />
                  <span className="min-w-0 truncate">{laboratory.laboratoryName}</span>
                </label>
              ))}
            </div>
          </div>
        )
      })}
      {groups.length === 0 && <p className="m-0 px-3 py-8 text-center text-xs text-[#87958f]">没有可分配的实验室</p>}
    </div>
  )
}

type EditorMode = 'create-user' | 'edit-user' | 'create-contact'

function AccountEditor({
  mode,
  target,
  laboratories,
  permissionTree,
  busy,
  onSaveUser,
  onSaveContact,
  onClose,
  initialAppRelations,
  editableRelations,
  permissionsLoading,
  permissionsError,
}: {
  mode: EditorMode
  target: ManagedUser | null
  laboratories: Laboratory[]
  permissionTree: PermissionTreeNode[]
  busy: boolean
  onSaveUser: (draft: UserCreateDraft | UserUpdateDraft) => Promise<void>
  onSaveContact: (draft: ContactCreateDraft) => Promise<void>
  onClose: () => void
  initialAppRelations: AppRelation[]
  editableRelations: ReadonlySet<AppRelation>
  permissionsLoading: boolean
  permissionsError: string | null
}) {
  const editing = mode === 'edit-user'
  const contactMode = mode === 'create-contact'
  const [user, setUser] = useState<UserCreateDraft>(() => ({
    ...emptyUser(),
    name: target?.name ?? '',
    username: target?.username ?? '',
    phone: target?.phone ?? '',
    email: target?.email ?? '',
    mark: target?.mark ?? '',
    appRelations: initialAppRelations,
  }))
  const [contact, setContact] = useState(emptyContact)
  const [replaceConfirmed, setReplaceConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setUser((current) => ({ ...current, appRelations: initialAppRelations }))
  }, [initialAppRelations])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      if (contactMode) {
        if (!contact.name.trim()) throw new Error('联系人姓名不能为空')
        if (!contact.phone.trim() && !contact.email.trim()) throw new Error('手机号和邮箱至少填写一项')
        await onSaveContact(contact)
        return
      }
      if (!user.name.trim() || !user.username.trim()) throw new Error('姓名和用户名不能为空')
      if (!editing && !user.password) throw new Error('密码不能为空')
      if (!user.phone.trim() && !user.email.trim()) throw new Error('手机号和邮箱至少填写一项')
      if (editing) {
        if (!replaceConfirmed) throw new Error('请确认授权范围将按当前选择整体替换')
        await onSaveUser({
          user: {
            name: user.name,
            username: user.username,
            phone: user.phone,
            email: user.email,
            mark: user.mark,
          },
          appRelations: user.appRelations,
          laboratoryIds: user.laboratoryIds,
        })
      } else {
        await onSaveUser(user)
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存失败')
    }
  }

  const title = contactMode ? '新增联系人' : editing ? '编辑用户与授权' : '新增系统用户'

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="关闭编辑器" onClick={busy ? undefined : onClose} className="absolute inset-0 bg-[#092018]/30 backdrop-blur-[3px]" />
      <form onSubmit={(event) => void submit(event)} className="absolute inset-y-0 right-0 flex w-full max-w-[760px] flex-col border-l border-white/70 bg-[#f9fbfa]/97 shadow-[-24px_0_70px_rgb(8_39_29_/_22%)] backdrop-blur-2xl">
        <header className="flex items-start justify-between gap-4 px-7 pt-7 pb-5">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-extrabold tracking-[.12em] text-[#18825c]">{contactMode ? 'CONTACT' : 'IDENTITY'}</p>
            <h2 className="m-0 truncate text-2xl">{title}</h2>
            {target && <p className="mt-1 mb-0 truncate font-mono text-[10px] text-[#929f99]">{target.id}</p>}
          </div>
          <button type="button" disabled={busy} onClick={onClose} className="rounded-xl bg-[#eaf1ee] px-3 py-2 text-sm font-bold active:scale-[.97] disabled:opacity-50">关闭</button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-28">
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
          {contactMode ? (
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <Field label="姓名"><input value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} className={inputClass} /></Field>
              <Field label="手机号"><input value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} className={inputClass} /></Field>
              <Field label="邮箱"><input type="email" value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} className={inputClass} /></Field>
              <Field label="备注"><input value={contact.mark} onChange={(event) => setContact({ ...contact, mark: event.target.value })} className={inputClass} /></Field>
            </div>
          ) : (
            <div className="grid gap-6">
              <section>
                <h3 className="m-0 text-sm">基本资料</h3>
                <p className="mt-1 mb-3 text-xs text-[#819089]">用于登录、联系和识别系统用户。</p>
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <Field label="姓名"><input value={user.name} onChange={(event) => setUser({ ...user, name: event.target.value })} className={inputClass} /></Field>
                  <Field label="用户名"><input value={user.username} onChange={(event) => setUser({ ...user, username: event.target.value })} className={inputClass} /></Field>
                  {!editing && <Field label="初始密码"><input type="password" autoComplete="new-password" value={user.password} onChange={(event) => setUser({ ...user, password: event.target.value })} className={inputClass} /></Field>}
                  <Field label="手机号"><input value={user.phone} onChange={(event) => setUser({ ...user, phone: event.target.value })} className={inputClass} /></Field>
                  <Field label="邮箱"><input type="email" value={user.email} onChange={(event) => setUser({ ...user, email: event.target.value })} className={inputClass} /></Field>
                  <Field label="备注"><input value={user.mark} onChange={(event) => setUser({ ...user, mark: event.target.value })} className={inputClass} /></Field>
                </div>
              </section>
              <section>
                <h3 className="m-0 text-sm">授权范围</h3>
                <p className="mt-1 mb-3 text-xs leading-5 text-[#819089]">
                  按真实后端关系分层展示；选择父节点可以批量选择其下全部权限。
                </p>
                {permissionsLoading && <p role="status" className="rounded-xl bg-[#edf5f1] px-4 py-3 text-xs text-[#587067]">正在读取现有权限与可转授范围…</p>}
                {permissionsError && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">{permissionsError}。为避免越权，权限选项已锁定。</p>}
                {!permissionsLoading && !permissionsError && (
                  <p className="rounded-xl bg-[#edf5f1] px-4 py-3 text-xs leading-5 text-[#587067]">
                    已回显用户现有权限。灰色项目超出你的可转授范围，将保持原值且不可修改。
                  </p>
                )}
                <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
                  <div>
                    <p className="mb-2 text-xs font-bold text-[#65766f]">应用权限</p>
                    <PermissionTree nodes={permissionTree} selected={user.appRelations} editable={editableRelations} onChange={(appRelations) => setUser({ ...user, appRelations })} />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-bold text-[#65766f]">实验室范围</p>
                    <LaboratoryScopePicker laboratories={laboratories} selected={user.laboratoryIds} onChange={(laboratoryIds) => setUser({ ...user, laboratoryIds })} />
                  </div>
                </div>
                {editing && (
                  <label className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-950">
                    <input type="checkbox" checked={replaceConfirmed} onChange={(event) => setReplaceConfirmed(event.target.checked)} className="mt-0.5 size-4 accent-amber-700" />
                    我确认已核对完整授权；未选中的应用权限和实验室范围将被撤销。
                  </label>
                )}
              </section>
            </div>
          )}
        </div>
        <footer className="absolute inset-x-0 bottom-0 flex justify-end gap-3 border-t border-[#dfe8e3] bg-white/92 px-7 py-4 backdrop-blur-xl">
          <button type="button" disabled={busy} onClick={onClose} className="rounded-xl bg-[#edf3f0] px-5 py-3 text-sm font-bold active:scale-[.97]">取消</button>
          <button type="submit" disabled={busy || permissionsLoading || Boolean(permissionsError)} className="rounded-xl bg-[#147a56] px-6 py-3 text-sm font-bold text-white active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-55">{busy ? '正在保存…' : '保存'}</button>
        </footer>
      </form>
    </div>
  )
}

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('zh-CN')
}

export function AccountManagement({
  dataSource = accountManagementDataSource,
  permissionTree = defaultPermissionTree,
  operatorUserId,
}: AccountManagementProps) {
  const usersById = useAccountStore((state) => state.usersById)
  const currentUserId = useAuthStore((state) => state.user?.id)
  const effectiveOperatorUserId = operatorUserId ?? currentUserId
  const status = useAccountStore((state) => state.status)
  const storeError = useAccountStore((state) => state.error)
  const setLoading = useAccountStore((state) => state.setLoading)
  const replaceUsers = useAccountStore((state) => state.replaceUsers)
  const upsertUser = useAccountStore((state) => state.upsertUser)
  const setStoreError = useAccountStore((state) => state.setError)
  const [laboratories, setLaboratories] = useState<Laboratory[]>([])
  const [search, setSearch] = useState('')
  const [editor, setEditor] = useState<{ mode: EditorMode; target: ManagedUser | null } | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [targetRelations, setTargetRelations] = useState<AppRelation[]>([])
  const [editableRelations, setEditableRelations] = useState<ReadonlySet<AppRelation>>(new Set())
  const [permissionsLoading, setPermissionsLoading] = useState(false)
  const [permissionsError, setPermissionsError] = useState<string | null>(null)

  const knownRelations = useMemo(() => new Set(permissionTree.flatMap(relationsOf)), [permissionTree])

  const openEditor = async (mode: EditorMode, target: ManagedUser | null) => {
    setNotice(null)
    setTargetRelations([])
    setEditableRelations(new Set())
    setPermissionsLoading(false)
    setPermissionsError(null)
    setEditor({ mode, target })
    if (mode === 'create-contact') return
    if (!effectiveOperatorUserId) {
      setPermissionsError('无法确认当前操作者身份')
      return
    }
    setPermissionsLoading(true)
    try {
      const [ownedRaw, targetRaw] = await Promise.all([
        dataSource.listUserPermissions(effectiveOperatorUserId),
        target ? dataSource.listUserPermissions(target.id) : Promise.resolve([]),
      ])
      const owned = ownedRaw.filter((value): value is AppRelation => knownRelations.has(value as AppRelation))
      const existing = targetRaw.filter((value): value is AppRelation => knownRelations.has(value as AppRelation))
      setTargetRelations(existing)
      setEditableRelations(new Set(owned.includes('super_admin') ? knownRelations : owned))
    } catch (cause) {
      setPermissionsError(cause instanceof Error ? cause.message : '权限范围加载失败')
    } finally {
      setPermissionsLoading(false)
    }
  }

  const load = async () => {
    setLoading()
    try {
      replaceUsers(await dataSource.listUsers())
    } catch (cause) {
      setStoreError(cause instanceof Error ? cause.message : '加载系统用户失败')
    }
  }

  useEffect(() => {
    void load()
    void dataSource.listLaboratories().then(setLaboratories).catch((cause: unknown) => {
      setStoreError(cause instanceof Error ? cause.message : '实验室范围加载失败')
    })
  // dataSource is an injectable stable integration boundary.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSource])

  const query = search.trim().toLowerCase()
  const users = useMemo(() => Object.values(usersById)
    .filter((user) => !query || [
      user.name,
      user.username ?? '',
      user.email ?? '',
      user.phone ?? '',
      user.id,
    ].some((value) => value.toLowerCase().includes(query)))
    .sort((left, right) => (right.createAt ?? '').localeCompare(left.createAt ?? '')), [query, usersById])

  const saveUser = async (draft: UserCreateDraft | UserUpdateDraft) => {
    if (!editor) return
    setBusy(true)
    try {
      const saved = editor.mode === 'edit-user' && editor.target
        ? await dataSource.updateUser(editor.target.id, draft as UserUpdateDraft)
        : await dataSource.createUser(draft as UserCreateDraft)
      upsertUser(saved)
      setNotice(editor.mode === 'edit-user' ? `用户“${saved.name}”已更新` : `用户“${saved.name}”已创建`)
      setEditor(null)
    } finally {
      setBusy(false)
    }
  }

  const saveContact = async (draft: ContactCreateDraft) => {
    setBusy(true)
    try {
      const saved = await dataSource.createContact(draft)
      setNotice(`联系人“${saved.name}”已创建`)
      setEditor(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-label="用户与联系人管理">
      <div className="rounded-2xl border border-[#dce6e1] bg-white p-4 shadow-[0_10px_34px_rgb(17_48_38_/_5%)]">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-[240px] flex-1">
            <span className="sr-only">搜索用户</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 fill-none stroke-[#809089] stroke-2">
              <circle cx="11" cy="11" r="6" />
              <path d="m16 16 4 4" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索姓名、用户名、邮箱或用户 ID"
              className={`${inputClass} w-full pl-11`}
            />
          </label>
          <button type="button" onClick={() => void load()} disabled={status === 'loading'} className="rounded-xl bg-[#edf3f0] px-4 py-3 text-sm font-bold text-[#587067] active:scale-[.97] disabled:opacity-50">
            {status === 'loading' ? '刷新中…' : '刷新'}
          </button>
          <span className="mx-1 h-7 w-px bg-[#dfe7e3] max-sm:hidden" aria-hidden="true" />
          <button type="button" onClick={() => { void openEditor('create-contact', null) }} className="rounded-xl bg-[#edf3f0] px-4 py-3 text-sm font-bold text-[#176c4e] active:scale-[.97]">
            新增联系人
          </button>
          <button type="button" onClick={() => { void openEditor('create-user', null) }} className="rounded-xl bg-[#147a56] px-5 py-3 text-sm font-bold text-white shadow-[0_7px_18px_rgb(20_122_86_/_18%)] active:scale-[.97]">
            新增用户
          </button>
        </div>
        <div className="mt-3 flex min-h-5 items-center justify-between gap-4 px-1 text-xs text-[#7b8a84]">
          <span>{query ? `找到 ${users.length} 位用户` : `共 ${users.length} 位系统用户`}</span>
          {notice && <span role="status" className="font-bold text-[#147a56]">{notice}</span>}
        </div>
      </div>

      {storeError && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{storeError}</p>}

      <div className="mt-5 overflow-hidden rounded-2xl border border-[#dce6e1] bg-white shadow-[0_10px_34px_rgb(17_48_38_/_5%)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] border-collapse text-left">
            <thead className="bg-[#f2f7f5] text-xs font-bold text-[#66776f]">
              <tr>
                <th scope="col" className="px-5 py-3.5">用户</th>
                <th scope="col" className="px-4 py-3.5">用户名</th>
                <th scope="col" className="px-4 py-3.5">联系方式</th>
                <th scope="col" className="px-4 py-3.5">备注</th>
                <th scope="col" className="px-4 py-3.5">创建日期</th>
                <th scope="col" className="sticky right-0 bg-[#f2f7f5] px-5 py-3.5 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="group border-t border-[#e5ece8] transition-colors hover:bg-[#f8fbf9]">
                  <td className="max-w-64 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e3f3ec] text-sm font-black text-[#176c4e]">{user.name.slice(0, 1)}</span>
                      <div className="min-w-0">
                        <p className="m-0 truncate text-sm font-bold text-[#183128]" title={user.name}>{user.name}</p>
                        <p className="mt-1 mb-0 truncate font-mono text-[10px] text-[#98a49f]" title={user.id}>{user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-48 px-4 py-4 text-sm font-semibold text-[#41564d]"><span className="block truncate">{user.username || '—'}</span></td>
                  <td className="max-w-64 px-4 py-4">
                    <span className="block truncate text-sm text-[#41564d]" title={user.phone || user.email}>{user.phone || user.email || '—'}</span>
                    {user.phone && user.email && <span className="mt-1 block truncate text-xs text-[#829089]">{user.email}</span>}
                  </td>
                  <td className="max-w-56 px-4 py-4 text-sm text-[#687971]"><span className="block truncate" title={user.mark}>{user.mark || '—'}</span></td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs text-[#77867f]">{formatDate(user.createAt)}</td>
                  <td className="sticky right-0 whitespace-nowrap bg-white px-5 py-4 text-right transition-colors group-hover:bg-[#f8fbf9]">
                    <button type="button" onClick={() => { void openEditor('edit-user', user) }} className="rounded-lg px-3 py-2 text-xs font-bold text-[#176c4e] hover:bg-[#e9f3ef] active:scale-[.96]">
                      编辑与授权
                    </button>
                  </td>
                </tr>
              ))}
              {status !== 'loading' && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm text-[#87958f]">{query ? '没有符合搜索条件的用户' : '当前没有系统用户'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {status === 'loading' && <div className="grid min-h-40 place-items-center border-t border-[#e5ece8] text-sm text-[#73827c]">正在加载系统用户…</div>}
      </div>

      {editor && (
        <AccountEditor
          key={`${editor.mode}-${editor.target?.id ?? 'new'}`}
          mode={editor.mode}
          target={editor.target}
          laboratories={laboratories}
          permissionTree={permissionTree}
          busy={busy}
          onSaveUser={saveUser}
          onSaveContact={saveContact}
          onClose={() => setEditor(null)}
          initialAppRelations={targetRelations}
          editableRelations={editableRelations}
          permissionsLoading={permissionsLoading}
          permissionsError={permissionsError}
        />
      )}
    </section>
  )
}
