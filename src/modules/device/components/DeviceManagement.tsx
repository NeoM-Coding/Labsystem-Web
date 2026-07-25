import { useEffect, useMemo, useState } from 'react'
import type { Laboratory } from '@/modules/laboratory/types'
import type { Device, DeviceType, Gateway } from '../types'

export interface DeviceManagementDataSource {
  listDevices: (laboratoryIds?: string[]) => Promise<Device[]>
  listGateways: (laboratoryIds?: string[]) => Promise<Gateway[]>
  listLaboratories: () => Promise<Laboratory[]>
  createDevice: (device: DeviceDraft) => Promise<Device>
  updateDevice: (deviceId: string, device: DeviceDraft) => Promise<Device>
  deleteDevice: (deviceId: string) => Promise<void>
  setPolling: (deviceId: string, enabled: boolean) => Promise<void>
  createGateway: (gateway: GatewayDraft) => Promise<Gateway>
  updateGateway: (gatewayId: string, gateway: GatewayDraft) => Promise<Gateway>
  deleteGateway: (gatewayId: string) => Promise<void>
}

export type DeviceDraft = Omit<Device, 'id' | 'locked' | 'createAt' | 'updateAt'>
export type GatewayDraft = Omit<Gateway, 'id' | 'createAt' | 'updateAt'>

const deviceTypes: DeviceType[] = ['Access', 'AirCondition', 'Sensor', 'CircuitBreak', 'Light']
const deviceTypeNames: Record<DeviceType, string> = {
  Access: '门禁',
  AirCondition: '空调',
  Sensor: '传感器',
  CircuitBreak: '断路器',
  Light: '照明',
}
const addressRanges: Record<DeviceType, [number, number]> = {
  Access: [1, 10],
  CircuitBreak: [11, 30],
  AirCondition: [31, 40],
  Light: [41, 60],
  Sensor: [61, 80],
}
const hasSelfId = (type: DeviceType) => ['AirCondition', 'Light', 'Sensor'].includes(type)

function emptyDevice(type: DeviceType = 'Access'): DeviceDraft {
  return {
    deviceName: '',
    belongTo: '',
    deviceType: type,
    polling: true,
    gatewayId: '',
    address: addressRanges[type][0],
    ...(hasSelfId(type) ? { selfId: 0 } : {}),
  }
}

function editableDevice(device: Device): DeviceDraft {
  return {
    deviceName: device.deviceName,
    belongTo: device.belongTo,
    deviceType: device.deviceType,
    polling: device.polling,
    gatewayId: device.gatewayId,
    address: device.address,
    ...(device.selfId !== undefined ? { selfId: device.selfId } : {}),
    ...(device.socketGatewayId !== undefined ? { socketGatewayId: device.socketGatewayId } : {}),
    ...(device.groupId !== undefined ? { groupId: device.groupId } : {}),
  }
}

const emptyGateway = (): GatewayDraft => ({
  gatewayName: '',
  usingIn: [],
  gatewayType: 'RS485',
  sendTopic: '',
  acceptTopic: '',
})

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-xs font-bold text-[#65766f]">
      {label}
      {children}
    </label>
  )
}

const inputClass = 'h-11 min-w-0 rounded-xl border border-[#d9e4df] bg-white px-3 text-sm text-[#20342c] outline-none transition-[border-color,box-shadow] focus:border-[#48a17f] focus:shadow-[0_0_0_3px_rgb(72_161_127_/_13%)]'

interface EditorProps {
  mode: 'device' | 'gateway'
  editing: Device | Gateway | null
  gateways: Gateway[]
  laboratories: Laboratory[]
  busy: boolean
  onCancel: () => void
  onSaveDevice: (draft: DeviceDraft) => Promise<void>
  onSaveGateway: (draft: GatewayDraft) => Promise<void>
}

function ManagementEditor({
  mode,
  editing,
  gateways,
  laboratories,
  busy,
  onCancel,
  onSaveDevice,
  onSaveGateway,
}: EditorProps) {
  const editingDevice = mode === 'device' ? editing as Device | null : null
  const editingGateway = mode === 'gateway' ? editing as Gateway | null : null
  const [device, setDevice] = useState<DeviceDraft>(() => editingDevice
    ? editableDevice(editingDevice)
    : emptyDevice())
  const [gateway, setGateway] = useState<GatewayDraft>(() => editingGateway
    ? { ...editingGateway, usingIn: [...editingGateway.usingIn] }
    : emptyGateway())
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      if (mode === 'device') {
        const [min, max] = addressRanges[device.deviceType]
        if (!device.deviceName.trim()) throw new Error('请输入设备名称')
        if (!device.belongTo) throw new Error('请选择所属实验室')
        if (!device.gatewayId) throw new Error('请选择网关')
        if (!Number.isInteger(device.address) || device.address < min || device.address > max) {
          throw new Error(`${deviceTypeNames[device.deviceType]}地址范围为 ${min}–${max}`)
        }
        if (hasSelfId(device.deviceType) && (!Number.isInteger(device.selfId) || (device.selfId ?? -1) < 0)) {
          throw new Error('设备内编号必须为非负整数')
        }
        await onSaveDevice({ ...device, deviceName: device.deviceName.trim() })
      } else {
        if (!gateway.gatewayName.trim()) throw new Error('请输入网关名称')
        if (gateway.usingIn.length === 0) throw new Error('请至少选择一个使用实验室')
        if (!gateway.sendTopic.trim() || !gateway.acceptTopic.trim()) throw new Error('请输入收发 Topic')
        await onSaveGateway({
          ...gateway,
          gatewayName: gateway.gatewayName.trim(),
          sendTopic: gateway.sendTopic.trim(),
          acceptTopic: gateway.acceptTopic.trim(),
        })
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存失败')
    }
  }

  const changeDeviceType = (deviceType: DeviceType) => {
    setDevice((current) => ({
      ...emptyDevice(deviceType),
      deviceName: current.deviceName,
      belongTo: current.belongTo,
      gatewayId: current.gatewayId,
      polling: current.polling,
    }))
  }

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={mode === 'device' ? '编辑设备' : '编辑网关'}>
      <button type="button" aria-label="关闭编辑器" onClick={busy ? undefined : onCancel} className="absolute inset-0 bg-[#092018]/30 backdrop-blur-[3px]" />
      <form
        onSubmit={(event) => void submit(event)}
        className="absolute inset-y-0 right-0 flex w-full max-w-[540px] flex-col border-l border-white/70 bg-[#f9fbfa]/97 shadow-[-24px_0_70px_rgb(8_39_29_/_22%)] backdrop-blur-2xl motion-safe:animate-[drawer-in_.22s_cubic-bezier(.2,.8,.2,1)]"
      >
        <header className="flex items-start justify-between gap-4 px-7 pt-7 pb-5">
          <div>
            <p className="mb-1 text-xs font-extrabold tracking-[.12em] text-[#18825c]">{editing ? 'EDIT' : 'CREATE'}</p>
            <h2 className="m-0 text-2xl">{editing ? '编辑' : '新增'}{mode === 'device' ? '设备' : '网关'}</h2>
          </div>
          <button type="button" disabled={busy} onClick={onCancel} className="rounded-xl bg-[#eaf1ee] px-3 py-2 text-sm font-bold active:scale-[.97] disabled:opacity-50">关闭</button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-28">
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
          {mode === 'device' ? (
            <div className="grid gap-5">
              <Field label="设备类型">
                <select disabled={Boolean(editingDevice)} value={device.deviceType} onChange={(event) => changeDeviceType(event.target.value as DeviceType)} className={inputClass}>
                  {deviceTypes.map((type) => <option key={type} value={type}>{deviceTypeNames[type]}</option>)}
                </select>
              </Field>
              <Field label="设备名称"><input value={device.deviceName} onChange={(event) => setDevice({ ...device, deviceName: event.target.value })} className={inputClass} /></Field>
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <Field label="所属实验室">
                  <select value={device.belongTo} onChange={(event) => setDevice({ ...device, belongTo: event.target.value, gatewayId: '' })} className={inputClass}>
                    <option value="">请选择</option>
                    {laboratories.map((lab) => <option key={lab.id} value={lab.id}>{lab.laboratoryName} · {lab.buildingName}</option>)}
                  </select>
                </Field>
                <Field label="网关">
                  <select value={device.gatewayId} onChange={(event) => setDevice({ ...device, gatewayId: event.target.value })} className={inputClass}>
                    <option value="">请选择</option>
                    {gateways.filter((item) => item.usingIn.includes(device.belongTo)).map((item) => <option key={item.id} value={item.id}>{item.gatewayName}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label={`设备地址（${addressRanges[device.deviceType][0]}–${addressRanges[device.deviceType][1]}）`}>
                  <input type="number" min={addressRanges[device.deviceType][0]} max={addressRanges[device.deviceType][1]} value={device.address} onChange={(event) => setDevice({ ...device, address: Number(event.target.value) })} className={inputClass} />
                </Field>
                {hasSelfId(device.deviceType) && (
                  <Field label={device.deviceType === 'AirCondition' ? '内机编号' : device.deviceType === 'Sensor' ? '探头编号' : '灯具编号'}>
                    <input type="number" min={0} value={device.selfId ?? 0} onChange={(event) => setDevice({ ...device, selfId: Number(event.target.value) })} className={inputClass} />
                  </Field>
                )}
              </div>
              {device.deviceType === 'AirCondition' && (
                <Field label="机组编号（留空由后端生成）">
                  <input value={device.groupId ?? ''} onChange={(event) => setDevice({ ...device, groupId: event.target.value || undefined })} className={inputClass} />
                </Field>
              )}
              <div className="grid gap-3 rounded-2xl bg-[#edf4f1] p-4">
                <label className="flex items-center justify-between gap-4 text-sm font-bold">
                  启用状态轮询
                  <input type="checkbox" checked={device.polling} onChange={(event) => setDevice({ ...device, polling: event.target.checked })} className="size-5 accent-[#16805a]" />
                </label>
              </div>
            </div>
          ) : (
            <div className="grid gap-5">
              <Field label="网关名称"><input value={gateway.gatewayName} onChange={(event) => setGateway({ ...gateway, gatewayName: event.target.value })} className={inputClass} /></Field>
              <Field label="发送 Topic"><input value={gateway.sendTopic} onChange={(event) => setGateway({ ...gateway, sendTopic: event.target.value })} className={inputClass} /></Field>
              <Field label="接收 Topic"><input value={gateway.acceptTopic} onChange={(event) => setGateway({ ...gateway, acceptTopic: event.target.value })} className={inputClass} /></Field>
              <fieldset className="rounded-2xl border border-[#d9e4df] p-4">
                <legend className="px-1 text-xs font-bold text-[#65766f]">使用实验室</legend>
                <div className="grid max-h-64 gap-2 overflow-y-auto">
                  {laboratories.map((lab) => (
                    <label key={lab.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-[#edf5f1]">
                      <input
                        type="checkbox"
                        checked={gateway.usingIn.includes(lab.id)}
                        onChange={() => setGateway({
                          ...gateway,
                          usingIn: gateway.usingIn.includes(lab.id)
                            ? gateway.usingIn.filter((id) => id !== lab.id)
                            : [...gateway.usingIn, lab.id],
                        })}
                        className="size-4 accent-[#16805a]"
                      />
                      <span className="min-w-0 truncate">{lab.laboratoryName} · {lab.buildingName} · {lab.orgName ?? '未设置单位'}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          )}
        </div>
        <footer className="absolute inset-x-0 bottom-0 flex justify-end gap-3 border-t border-[#dfe8e3] bg-white/92 px-7 py-4 backdrop-blur-xl">
          <button type="button" disabled={busy} onClick={onCancel} className="rounded-xl bg-[#edf3f0] px-5 py-3 text-sm font-bold active:scale-[.97]">取消</button>
          <button type="submit" disabled={busy} className="rounded-xl bg-[#147a56] px-6 py-3 text-sm font-bold text-white active:scale-[.97] disabled:opacity-55">{busy ? '正在保存…' : '保存'}</button>
        </footer>
      </form>
    </div>
  )
}

export function DeviceManagement({
  dataSource,
  laboratoryIds = [],
}: {
  dataSource: DeviceManagementDataSource
  laboratoryIds?: string[]
}) {
  const [mode, setMode] = useState<'device' | 'gateway'>('device')
  const [devices, setDevices] = useState<Device[]>([])
  const [gateways, setGateways] = useState<Gateway[]>([])
  const [laboratories, setLaboratories] = useState<Laboratory[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [editor, setEditor] = useState<{ mode: 'device' | 'gateway'; entity: Device | Gateway | null } | null>(null)
  const [deleting, setDeleting] = useState<Device | Gateway | null>(null)
  const laboratoryScopeKey = [...laboratoryIds].sort().join(',')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [nextDevices, nextGateways, nextLabs] = await Promise.all([
        laboratoryIds.length ? dataSource.listDevices(laboratoryIds) : Promise.resolve([]),
        laboratoryIds.length ? dataSource.listGateways(laboratoryIds) : Promise.resolve([]),
        dataSource.listLaboratories(),
      ])
      setDevices(nextDevices)
      setGateways(nextGateways.filter((gateway) => gateway.gatewayType === 'RS485'))
      setLaboratories(nextLabs)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '设备管理数据加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  // The data-source is an integration boundary and should remain stable per page.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSource, laboratoryScopeKey])

  const query = search.trim().toLowerCase()
  const visibleDevices = useMemo(() => devices.filter((device) => !query
    || device.deviceName.toLowerCase().includes(query)
    || device.id.toLowerCase().includes(query)
    || deviceTypeNames[device.deviceType].includes(query)), [devices, query])
  const visibleGateways = useMemo(() => gateways.filter((gateway) => !query
    || gateway.gatewayName.toLowerCase().includes(query)
    || gateway.id.toLowerCase().includes(query)
    || gateway.sendTopic.toLowerCase().includes(query)
    || gateway.acceptTopic.toLowerCase().includes(query)), [gateways, query])
  const scopedLaboratories = laboratories.filter((laboratory) => laboratoryIds.includes(laboratory.id))
  const laboratoryName = (id: string) => laboratories.find((lab) => lab.id === id)?.laboratoryName ?? id
  const gatewayName = (id: string) => gateways.find((gateway) => gateway.id === id)?.gatewayName ?? id

  const run = async (operation: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await operation()
      await load()
      setEditor(null)
      setDeleting(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '操作失败')
      throw cause
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-label="设备管理">
      <div className="rounded-2xl border border-[#dce6e1] bg-white p-3 shadow-[0_10px_34px_rgb(17_48_38_/_5%)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl bg-[#eaf1ee] p-1">
            {(['device', 'gateway'] as const).map((item) => (
              <button key={item} type="button" onClick={() => setMode(item)} className={`rounded-[9px] px-4 py-2 text-sm font-bold transition-[background-color,color,box-shadow,transform] active:scale-[.97] ${mode === item ? 'bg-white text-[#126b4b] shadow-sm' : 'text-[#708079]'}`}>
                {item === 'device' ? `设备 ${devices.length}` : `网关 ${gateways.length}`}
              </button>
            ))}
          </div>
          <label className="ml-auto min-w-60 flex-1 max-w-md">
            <span className="sr-only">搜索</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={mode === 'device' ? '搜索设备名称、ID 或类型' : '搜索网关名称、ID 或 Topic'} className={`${inputClass} w-full`} />
          </label>
          <button type="button" onClick={() => setEditor({ mode, entity: null })} className="rounded-xl bg-[#147a56] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgb(20_122_86_/_18%)] active:scale-[.97]">
            新增{mode === 'device' ? '设备' : '网关'}
          </button>
        </div>
      </div>

      {error && <div role="alert" className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"><span>{error}</span><button type="button" onClick={() => setError(null)}>关闭</button></div>}
      {loading ? (
        <div className="mt-5 grid min-h-56 place-items-center rounded-2xl border border-[#e0e8e4] bg-white text-sm text-[#73827c]">正在加载设备配置…</div>
      ) : (
        <div className="mt-5 grid gap-3">
          {mode === 'device' ? visibleDevices.map((device) => (
            <article key={device.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#dde7e2] bg-white px-5 py-4 shadow-[0_7px_24px_rgb(17_48_38_/_4%)]">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e7f4ef] text-xs font-black text-[#147454]">{deviceTypeNames[device.deviceType].slice(0, 1)}</div>
              <div className="min-w-44 flex-1">
                <h3 className="m-0 truncate text-base">{device.deviceName}</h3>
                <p className="mt-1 mb-0 truncate text-xs text-[#7a8983]">{deviceTypeNames[device.deviceType]} · {laboratoryName(device.belongTo)} · 地址 {device.address}{device.selfId !== undefined ? ` / ${device.selfId}` : ''}</p>
              </div>
              <div className="min-w-40 text-xs text-[#6f8179]"><strong className="block truncate text-[#294039]">{gatewayName(device.gatewayId)}</strong><span className="font-mono">{device.id}</span></div>
              <label className="flex items-center gap-2 text-xs font-bold text-[#5f7169]">轮询<input type="checkbox" checked={device.polling} disabled={busy} onChange={(event) => void run(() => dataSource.setPolling(device.id, event.target.checked)).catch(() => undefined)} className="size-4 accent-[#16805a]" /></label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditor({ mode: 'device', entity: device })} className="rounded-lg bg-[#edf4f1] px-3 py-2 text-xs font-bold text-[#176c4e] active:scale-[.96]">编辑</button>
                <button type="button" onClick={() => { setError(null); setDeleting(device) }} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 active:scale-[.96]">删除</button>
              </div>
            </article>
          )) : visibleGateways.map((gateway) => (
            <article key={gateway.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#dde7e2] bg-white px-5 py-4 shadow-[0_7px_24px_rgb(17_48_38_/_4%)]">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e7f4ef] text-[10px] font-black text-[#147454]">485</div>
              <div className="min-w-44 flex-1">
                <h3 className="m-0 truncate text-base">{gateway.gatewayName}</h3>
                <p className="mt-1 mb-0 truncate text-xs text-[#7a8983]">{gateway.usingIn.map(laboratoryName).join('、') || '未设置实验室'}</p>
              </div>
              <div className="min-w-64 text-xs text-[#6f8179]"><p className="m-0 truncate">发送：<span className="font-mono">{gateway.sendTopic}</span></p><p className="mt-1 mb-0 truncate">接收：<span className="font-mono">{gateway.acceptTopic}</span></p></div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditor({ mode: 'gateway', entity: gateway })} className="rounded-lg bg-[#edf4f1] px-3 py-2 text-xs font-bold text-[#176c4e] active:scale-[.96]">编辑</button>
                <button type="button" onClick={() => { setError(null); setDeleting(gateway) }} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 active:scale-[.96]">删除</button>
              </div>
            </article>
          ))}
          {((mode === 'device' ? visibleDevices : visibleGateways).length === 0) && (
            <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-[#cbdad3] bg-white/60 text-sm text-[#73827c]">没有匹配的{mode === 'device' ? '设备' : '网关'}</div>
          )}
        </div>
      )}

      {editor && (
        <ManagementEditor
          key={`${editor.mode}-${editor.entity?.id ?? 'new'}`}
          mode={editor.mode}
          editing={editor.entity}
          gateways={gateways}
          laboratories={scopedLaboratories}
          busy={busy}
          onCancel={() => setEditor(null)}
          onSaveDevice={(draft) => run(async () => {
            if (editor.entity) await dataSource.updateDevice(editor.entity.id, draft)
            else await dataSource.createDevice(draft)
          })}
          onSaveGateway={(draft) => run(async () => {
            if (editor.entity) await dataSource.updateGateway(editor.entity.id, draft)
            else await dataSource.createGateway(draft)
          })}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-[#092018]/30 p-5 backdrop-blur-[3px]" role="alertdialog" aria-modal="true" aria-label="确认删除">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_24px_80px_rgb(8_39_29_/_25%)]">
            <h2 className="m-0 text-xl">确认删除？</h2>
            <p className="mt-3 text-sm leading-6 text-[#677870]">
              将删除“{'deviceName' in deleting ? deleting.deviceName : deleting.gatewayName}”。删除网关前必须先移除其关联设备。
            </p>
            {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={busy} onClick={() => setDeleting(null)} className="rounded-xl bg-[#edf3f0] px-4 py-2.5 text-sm font-bold">取消</button>
              <button type="button" disabled={busy} onClick={() => void run(() => 'deviceName' in deleting ? dataSource.deleteDevice(deleting.id) : dataSource.deleteGateway(deleting.id)).catch(() => undefined)} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? '正在删除…' : '确认删除'}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
