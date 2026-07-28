import { useEffect, useMemo, useState } from 'react'
import { getLaboratories } from '@/modules/laboratory/api/laboratories'
import type { Laboratory } from '@/modules/laboratory/types'
import {
  createContact,
  createUser,
  updateUser,
} from '../api/accounts'
import { useAccountStore } from '../store/accountStore'
import type {
  AppRelation,
  ContactCreateDraft,
  ManagedUser,
  UserCreateDraft,
  UserUpdateDraft,
} from '../types'

export interface AccountManagementDataSource {
  listLaboratories: () => Promise<Laboratory[]>
  createUser: (draft: UserCreateDraft) => Promise<ManagedUser>
  updateUser: (userId: string, draft: UserUpdateDraft) => Promise<ManagedUser>
  createContact: (draft: ContactCreateDraft) => Promise<ManagedUser>
}

const accountManagementDataSource: AccountManagementDataSource = {
  listLaboratories: () => getLaboratories([], []),
  createUser,
  updateUser,
  createContact,
}

const relationOptions: { value: AppRelation; label: string; group: string }[] = [
  { value: 'super_admin', label: '系统超级管理员', group: '系统' },
  { value: 'user_manager', label: '用户管理', group: '用户' },
  { value: 'user_viewer', label: '用户查看', group: '用户' },
  { value: 'laboratory_manager', label: '实验室管理', group: '实验室' },
  { value: 'smart_manager', label: '智能策略管理', group: '策略' },
  { value: 'smart_viewer', label: '智能策略查看', group: '策略' },
  { value: 'smart_keeper', label: '智能策略值守', group: '策略' },
  { value: 'data_analyst', label: '数据分析', group: '数据' },
  { value: 'edu_semester_manager', label: '学期管理', group: '教务' },
  { value: 'edu_semester_viewer', label: '学期查看', group: '教务' },
  { value: 'edu_timetable_manager', label: '课表管理', group: '教务' },
  { value: 'edu_timetable_viewer', label: '课表查看', group: '教务' },
]

const inputClass = 'h-11 min-w-0 rounded-xl border border-[#d9e4df] bg-white px-3 text-sm text-[#20342c] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#48a17f] focus:shadow-[0_0_0_3px_rgb(72_161_127_/_13%)]'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid min-w-0 gap-1.5 text-xs font-bold text-[#65766f]">{label}{children}</label>
}

function ScopePicker({
  laboratories,
  relations,
  laboratoryIds,
  onRelations,
  onLaboratories,
}: {
  laboratories: Laboratory[]
  relations: AppRelation[]
  laboratoryIds: string[]
  onRelations: (relations: AppRelation[]) => void
  onLaboratories: (laboratoryIds: string[]) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
      <fieldset className="rounded-2xl border border-[#dce6e1] p-4">
        <legend className="px-1 text-xs font-bold text-[#65766f]">应用权限</legend>
        <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto max-sm:grid-cols-1">
          {relationOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs hover:bg-[#edf4f1]">
              <input type="checkbox" checked={relations.includes(option.value)} onChange={() => onRelations(relations.includes(option.value) ? relations.filter((item) => item !== option.value) : [...relations, option.value])} className="size-4 accent-[#16805a]" />
              <span className="min-w-0 truncate">{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="rounded-2xl border border-[#dce6e1] p-4">
        <legend className="px-1 text-xs font-bold text-[#65766f]">实验室范围</legend>
        <div className="grid max-h-64 gap-2 overflow-y-auto">
          {laboratories.map((laboratory) => (
            <label key={laboratory.id} className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs hover:bg-[#edf4f1]">
              <input type="checkbox" checked={laboratoryIds.includes(laboratory.id)} onChange={() => onLaboratories(laboratoryIds.includes(laboratory.id) ? laboratoryIds.filter((id) => id !== laboratory.id) : [...laboratoryIds, laboratory.id])} className="size-4 accent-[#16805a]" />
              <span className="min-w-0 truncate">{laboratory.laboratoryName} · {laboratory.buildingName}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  )
}

const emptyUser: UserCreateDraft = {
  name: '', username: '', password: '', phone: '', email: '', mark: '',
  appRelations: [], laboratoryIds: [],
}
const emptyContact: ContactCreateDraft = { name: '', phone: '', email: '', mark: '' }

export function AccountManagement({
  dataSource = accountManagementDataSource,
}: {
  dataSource?: AccountManagementDataSource
}) {
  const [mode, setMode] = useState<'create' | 'update' | 'contact'>('create')
  const [laboratories, setLaboratories] = useState<Laboratory[]>([])
  const [user, setUser] = useState<UserCreateDraft>(emptyUser)
  const [contact, setContact] = useState<ContactCreateDraft>(emptyContact)
  const [updateId, setUpdateId] = useState('')
  const [updateProfile, setUpdateProfile] = useState({ name: '', username: '', phone: '', email: '', mark: '' })
  const [updateRelations, setUpdateRelations] = useState<AppRelation[]>([])
  const [updateLaboratories, setUpdateLaboratories] = useState<string[]>([])
  const [replaceConfirmed, setReplaceConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const recentUsers = useAccountStore((state) => state.recentUsers)
  const record = useAccountStore((state) => state.record)

  useEffect(() => {
    void dataSource.listLaboratories().then(setLaboratories).catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : '实验室范围加载失败')
    })
  }, [dataSource])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setBusy(true)
    try {
      let saved: ManagedUser
      if (mode === 'create') {
        if (!user.name.trim() || !user.username.trim() || !user.password) throw new Error('姓名、用户名和密码不能为空')
        if (!user.phone.trim() && !user.email.trim()) throw new Error('手机号和邮箱至少填写一项')
        saved = await dataSource.createUser(user)
        setUser(emptyUser)
        setSuccess(`系统用户“${saved.name}”已创建`)
      } else if (mode === 'contact') {
        if (!contact.name.trim()) throw new Error('联系人姓名不能为空')
        if (!contact.phone.trim() && !contact.email.trim()) throw new Error('手机号和邮箱至少填写一项')
        saved = await dataSource.createContact(contact)
        setContact(emptyContact)
        setSuccess(`联系人“${saved.name}”已创建`)
      } else {
        if (!updateId.trim()) throw new Error('用户 ID 不能为空')
        if (!replaceConfirmed) throw new Error('请确认理解权限范围将被整体替换')
        const profile = Object.fromEntries(
          Object.entries(updateProfile).filter(([, value]) => value.trim()),
        )
        saved = await dataSource.updateUser(updateId.trim(), {
          user: profile,
          appRelations: updateRelations,
          laboratoryIds: updateLaboratories,
        })
        setSuccess(`用户“${saved.name || updateId}”已更新`)
      }
      record(saved)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '操作失败')
    } finally {
      setBusy(false)
    }
  }

  const title = useMemo(() => ({
    create: '创建系统用户',
    update: '按用户 ID 更新',
    contact: '创建业务联系人',
  })[mode], [mode])

  return (
    <section aria-label="用户与联系人管理">
      <div className="flex flex-wrap gap-1 rounded-2xl border border-[#dce6e1] bg-white p-1.5 shadow-[0_10px_34px_rgb(17_48_38_/_5%)]">
        {(['create', 'update', 'contact'] as const).map((item) => (
          <button key={item} type="button" onClick={() => { setMode(item); setError(null); setSuccess(null) }} className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[.97] ${mode === item ? 'bg-[#e6f3ed] text-[#126b4b] shadow-sm' : 'text-[#708079]'}`}>
            {{ create: '新增用户', update: '更新用户', contact: '新增联系人' }[item]}
          </button>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_280px] gap-5 max-xl:grid-cols-1">
        <form onSubmit={(event) => void submit(event)} className="rounded-2xl border border-[#dce6e1] bg-white p-6 shadow-[0_10px_34px_rgb(17_48_38_/_5%)]">
          <h2 className="mt-0 text-xl">{title}</h2>
          {mode === 'update' && <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">后端暂未提供用户列表或详情查询。此接口会把提交的应用权限和实验室范围整体替换，请先从可信来源确认用户 ID 和完整权限。</p>}
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
          {success && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{success}</p>}
          {mode === 'create' && (
            <div className="grid gap-5">
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <Field label="姓名"><input value={user.name} onChange={(event) => setUser({ ...user, name: event.target.value })} className={inputClass} /></Field>
                <Field label="用户名"><input value={user.username} onChange={(event) => setUser({ ...user, username: event.target.value })} className={inputClass} /></Field>
                <Field label="密码"><input type="password" autoComplete="new-password" value={user.password} onChange={(event) => setUser({ ...user, password: event.target.value })} className={inputClass} /></Field>
                <Field label="手机号"><input value={user.phone} onChange={(event) => setUser({ ...user, phone: event.target.value })} className={inputClass} /></Field>
                <Field label="邮箱"><input type="email" value={user.email} onChange={(event) => setUser({ ...user, email: event.target.value })} className={inputClass} /></Field>
                <Field label="备注"><input value={user.mark} onChange={(event) => setUser({ ...user, mark: event.target.value })} className={inputClass} /></Field>
              </div>
              <ScopePicker laboratories={laboratories} relations={user.appRelations} laboratoryIds={user.laboratoryIds} onRelations={(appRelations) => setUser({ ...user, appRelations })} onLaboratories={(laboratoryIds) => setUser({ ...user, laboratoryIds })} />
            </div>
          )}
          {mode === 'contact' && (
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <Field label="姓名"><input value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} className={inputClass} /></Field>
              <Field label="手机号"><input value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} className={inputClass} /></Field>
              <Field label="邮箱"><input type="email" value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} className={inputClass} /></Field>
              <Field label="备注"><input value={contact.mark} onChange={(event) => setContact({ ...contact, mark: event.target.value })} className={inputClass} /></Field>
            </div>
          )}
          {mode === 'update' && (
            <div className="grid gap-5">
              <Field label="用户 ID"><input value={updateId} onChange={(event) => setUpdateId(event.target.value)} className={inputClass} /></Field>
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                {([
                  ['name', '姓名'],
                  ['username', '用户名'],
                  ['phone', '手机号'],
                  ['email', '邮箱'],
                  ['mark', '备注'],
                ] as const).map(([key, label]) => (
                  <Field key={key} label={`${label}（留空不修改）`}><input value={updateProfile[key]} onChange={(event) => setUpdateProfile({ ...updateProfile, [key]: event.target.value })} className={inputClass} /></Field>
                ))}
              </div>
              <ScopePicker laboratories={laboratories} relations={updateRelations} laboratoryIds={updateLaboratories} onRelations={setUpdateRelations} onLaboratories={setUpdateLaboratories} />
              <label className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-950">
                <input type="checkbox" checked={replaceConfirmed} onChange={(event) => setReplaceConfirmed(event.target.checked)} className="mt-0.5 size-4 accent-amber-700" />
                我确认已核对完整权限；未选中的权限与实验室范围将被撤销。
              </label>
            </div>
          )}
          <div className="mt-6 flex justify-end border-t border-[#e6ece9] pt-5">
            <button type="submit" disabled={busy} className="rounded-xl bg-[#147a56] px-6 py-3 text-sm font-bold text-white active:scale-[.97] disabled:opacity-55">{busy ? '正在提交…' : title}</button>
          </div>
        </form>
        <aside className="rounded-2xl border border-[#dce6e1] bg-white p-5 shadow-[0_10px_34px_rgb(17_48_38_/_5%)]">
          <h2 className="mt-0 text-base">本次会话最近结果</h2>
          <div className="grid gap-2">
            {recentUsers.map((item) => (
              <div key={item.id} className="rounded-xl bg-[#f1f6f3] p-3">
                <strong className="block truncate text-sm">{item.name}</strong>
                <span className="mt-1 block truncate font-mono text-[10px] text-[#819089]">{item.id}</span>
              </div>
            ))}
            {recentUsers.length === 0 && <p className="text-xs leading-5 text-[#83918c]">后端没有列表接口；成功创建或更新的用户会暂时显示在这里。</p>}
          </div>
        </aside>
      </div>
    </section>
  )
}
