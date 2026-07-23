import { forwardRef, useEffect, useMemo, useState } from 'react'
import { VirtuosoGrid } from 'react-virtuoso'
import {
  isTelemetryOnline,
  selectVisibleDevices,
  selectVisibleGateways,
  useDeviceStore,
} from '../store/deviceStore'
import type { Device, DeviceTelemetry, Gateway, TelemetryRecord } from '../types'
import type { DeviceControlDataSource } from '../control/types'
import {
  DeviceEntitySwitchBar,
  DeviceTypeSwitchBar,
} from './DeviceSwitchBars'
import { DeviceControlDialog } from './DeviceControlDialog'

const deviceTypeName: Record<Device['deviceType'], string> = {
  Access: '门禁',
  AirCondition: '空调',
  Sensor: '传感器',
  CircuitBreak: '断路器',
  Light: '照明',
}

const telemetryLabel: Record<string, string> = {
  temperature: '温度',
  humidity: '湿度',
  co2: 'CO₂',
  opened: '开合',
  locked: '锁定',
  mode: '模式',
  speed: '风速',
  brightness: '亮度',
  voltage: '电压',
  current: '电流',
  power: '功率',
}

function displayValue(key: string, value: TelemetryRecord[string]) {
  if (value === null) return '—'
  if (typeof value === 'boolean') return value ? '是' : '否'
  const unit = key === 'temperature' ? ' °C'
    : key === 'humidity' ? ' %'
      : key === 'co2' ? ' ppm'
        : key === 'brightness' ? ' %'
          : key === 'voltage' ? ' V'
            : key === 'current' ? ' A'
              : key === 'power' ? ' W'
                : ''
  return `${String(value)}${unit}`
}

function StatusDot({ online }: { online: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-bold ${
      online ? 'text-[#137a55]' : 'text-[#85928d]'
    }`}>
      <span className={`h-2 w-2 rounded-full ${online ? 'bg-[#32bd86]' : 'bg-[#b7c1bd]'}`} />
      {online ? '在线' : '离线'}
    </span>
  )
}

const GridList = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ children, ...props }, ref) => (
    <div
      {...props}
      ref={ref}
      className="grid grid-cols-3 gap-4 pb-2 max-xl:grid-cols-2 max-md:grid-cols-1"
    >
      {children}
    </div>
  ),
)
GridList.displayName = 'GridList'

interface DeviceCardProps {
  device: Device
  telemetry?: DeviceTelemetry
  selectionMode: boolean
  selected: boolean
  incompatible: boolean
}

function DeviceCard({
  device,
  telemetry,
  selectionMode,
  selected,
  incompatible,
}: DeviceCardProps) {
  const select = useDeviceStore((state) => state.selectEntity)
  const toggleSelection = useDeviceStore((state) => state.toggleDeviceSelection)
  const clock = useDeviceStore((state) => state.clock)
  const entries = Object.entries(telemetry?.record ?? {}).slice(0, 3)
  return (
    <button
      type="button"
      aria-pressed={selectionMode ? selected : undefined}
      disabled={incompatible}
      onClick={() => selectionMode ? toggleSelection(device.id) : select(device.id)}
      className={`group relative min-h-52 w-full rounded-2xl border bg-white p-5 text-left transition-[border-color,box-shadow,transform,opacity] duration-150 active:scale-[.98] ${
        selected
          ? 'border-[#2c9971] shadow-[0_0_0_3px_rgb(44_153_113_/_15%),0_12px_34px_rgb(17_48_38_/_10%)]'
          : 'border-[#dfe8e3] shadow-[0_8px_28px_rgb(17_48_38_/_5%)] hover:border-[#b9d7cb] hover:shadow-[0_12px_34px_rgb(17_48_38_/_9%)]'
      } ${incompatible ? 'cursor-not-allowed opacity-45' : ''}`}
    >
      {selectionMode && (
        <span
          aria-hidden="true"
          className={`absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full border text-xs font-black transition-[background-color,border-color,color] duration-150 ${
            selected
              ? 'border-[#16805a] bg-[#16805a] text-white'
              : 'border-[#c6d3ce] bg-white text-transparent'
          }`}
        >
          ✓
        </span>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 truncate text-base font-bold text-[#1b3029]">{device.deviceName}</p>
          <p className="m-0 text-xs text-[#7a8983]">{deviceTypeName[device.deviceType]} · 地址 {device.address}</p>
        </div>
        {!selectionMode && <StatusDot online={isTelemetryOnline(telemetry, clock)} />}
      </div>
      <div className="mt-6 grid grid-cols-3 gap-2">
        {entries.length > 0 ? entries.map(([key, value]) => (
          <div key={key} className="rounded-xl bg-[#f3f7f5] px-3 py-3">
            <span className="block truncate text-[11px] font-semibold text-[#819089]">
              {telemetryLabel[key] ?? key}
            </span>
            <strong className="mt-1 block truncate text-sm text-[#294039]">
              {displayValue(key, value)}
            </strong>
          </div>
        )) : (
          <p className="col-span-3 m-0 py-4 text-sm text-[#8c9994]">暂无遥测数据</p>
        )}
      </div>
      <p className="mt-5 mb-0 truncate font-mono text-[11px] text-[#9aa6a1]">{device.id}</p>
    </button>
  )
}

function GatewayCard({ gateway }: { gateway: Gateway }) {
  const select = useDeviceStore((state) => state.selectEntity)
  return (
    <button
      type="button"
      onClick={() => select(gateway.id)}
      className="min-h-52 w-full rounded-2xl border border-[#dfe8e3] bg-white p-5 text-left shadow-[0_8px_28px_rgb(17_48_38_/_5%)] transition-[border-color,box-shadow,transform] duration-150 hover:border-[#b9d7cb] hover:shadow-[0_12px_34px_rgb(17_48_38_/_9%)] active:scale-[.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-base font-bold">{gateway.gatewayName}</p>
          <p className="m-0 text-xs text-[#7a8983]">{gateway.gatewayType} 网关</p>
        </div>
        <span className="rounded-full bg-[#e8f5f0] px-2.5 py-1 text-xs font-bold text-[#176a4d]">
          {gateway.usingIn.length} 个实验室
        </span>
      </div>
      <dl className="mt-6 grid gap-3 text-xs">
        <div><dt className="text-[#819089]">发送 Topic</dt><dd className="m-0 mt-1 truncate font-mono text-[#294039]">{gateway.sendTopic}</dd></div>
        <div><dt className="text-[#819089]">接收 Topic</dt><dd className="m-0 mt-1 truncate font-mono text-[#294039]">{gateway.acceptTopic}</dd></div>
      </dl>
    </button>
  )
}

function EmptyState({ entityMode }: { entityMode: 'device' | 'gateway' }) {
  return (
    <div className="grid min-h-96 place-items-center rounded-2xl border border-dashed border-[#cddbd5] bg-white/60 p-8 text-center">
      <div>
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#e7f3ee] text-xl">⌁</div>
        <h2 className="mb-2 text-lg">没有匹配的{entityMode === 'device' ? '设备' : '网关'}</h2>
        <p className="m-0 text-sm text-[#77867f]">调整实验室范围、类型或搜索条件后再试。</p>
      </div>
    </div>
  )
}

function DetailDrawer({ controlDataSource }: { controlDataSource?: DeviceControlDataSource }) {
  const selectedId = useDeviceStore((state) => state.selectedEntityId)
  const entityMode = useDeviceStore((state) => state.entityMode)
  const device = useDeviceStore((state) => selectedId ? state.devicesById[selectedId] : undefined)
  const gateway = useDeviceStore((state) => selectedId ? state.gatewaysById[selectedId] : undefined)
  const telemetry = useDeviceStore((state) => device ? state.telemetryByDeviceId[device.id] : undefined)
  const close = useDeviceStore((state) => state.selectEntity)
  const entity = entityMode === 'device' ? device : gateway
  const [controlOpen, setControlOpen] = useState(false)

  useEffect(() => {
    if (!selectedId || controlOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [close, controlOpen, selectedId])

  if (!selectedId || !entity) return null
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="设备详情">
      <button
        type="button"
        aria-label="关闭详情"
        onClick={() => close(null)}
        className="absolute inset-0 bg-[#0c211a]/25 backdrop-blur-[2px]"
      />
      <aside className="absolute inset-y-0 right-0 w-full max-w-[480px] overflow-y-auto border-l border-white/70 bg-white/95 p-7 shadow-[-22px_0_60px_rgb(11_37_28_/_18%)] backdrop-blur-xl motion-safe:animate-[drawer-in_.22s_cubic-bezier(.2,.8,.2,1)] max-sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-extrabold tracking-[.12em] text-[#18825c]">DETAIL</p>
            <h2 className="m-0 text-2xl">{entityMode === 'device' ? device?.deviceName : gateway?.gatewayName}</h2>
          </div>
          <button type="button" onClick={() => close(null)} className="rounded-xl bg-[#eef3f1] px-3 py-2 text-sm font-bold active:scale-[.97]">关闭</button>
        </div>
        <div className="mt-7 rounded-2xl bg-[#f2f7f4] p-5">
          {entityMode === 'device' && device ? (
            <dl className="grid grid-cols-[100px_1fr] gap-y-3 text-sm">
              <dt className="text-[#73827c]">设备类型</dt><dd className="m-0 font-semibold">{deviceTypeName[device.deviceType]}</dd>
              <dt className="text-[#73827c]">设备地址</dt><dd className="m-0 font-semibold">{device.address}</dd>
              <dt className="text-[#73827c]">网关 ID</dt><dd className="m-0 break-all font-mono text-xs">{device.gatewayId}</dd>
              <dt className="text-[#73827c]">设备 ID</dt><dd className="m-0 break-all font-mono text-xs">{device.id}</dd>
            </dl>
          ) : gateway ? (
            <dl className="grid grid-cols-[100px_1fr] gap-y-3 text-sm">
              <dt className="text-[#73827c]">网关类型</dt><dd className="m-0 font-semibold">{gateway.gatewayType}</dd>
              <dt className="text-[#73827c]">使用范围</dt><dd className="m-0 font-semibold">{gateway.usingIn.length} 个实验室</dd>
              <dt className="text-[#73827c]">网关 ID</dt><dd className="m-0 break-all font-mono text-xs">{gateway.id}</dd>
            </dl>
          ) : null}
        </div>
        {device && (
          <section className="mt-7">
            <h3 className="text-base">当前遥测</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(telemetry?.record ?? {}).map(([key, value]) => (
                <div className="rounded-xl border border-[#e0e8e4] p-4" key={key}>
                  <span className="block text-xs text-[#7c8a84]">{telemetryLabel[key] ?? key}</span>
                  <strong className="mt-1 block">{displayValue(key, value)}</strong>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-[#8a9792]">
              最后数据：{telemetry?.occurredAt ? new Date(telemetry.occurredAt).toLocaleString('zh-CN') : '暂无'}
            </p>
            <button
              type="button"
              onClick={() => setControlOpen(true)}
              className="mt-4 w-full rounded-xl bg-[#147a56] px-5 py-3 text-sm font-bold text-white transition-[transform,background-color] duration-150 hover:bg-[#106b4a] active:scale-[.97]"
            >
              控制此设备
            </button>
          </section>
        )}
      </aside>
      {device && (
        <DeviceControlDialog
          open={controlOpen}
          targets={[device]}
          dataSource={controlDataSource}
          onClose={() => setControlOpen(false)}
        />
      )}
    </div>
  )
}

export function DeviceDataCenter({
  controlDataSource,
}: {
  controlDataSource?: DeviceControlDataSource
}) {
  const state = useDeviceStore()
  const [multiControlOpen, setMultiControlOpen] = useState(false)
  const devices = useMemo(() => selectVisibleDevices(state), [state])
  const gateways = useMemo(() => selectVisibleGateways(state), [state])
  const items = state.entityMode === 'device' ? devices : gateways
  const onlineCount = devices.filter((device) => isTelemetryOnline(state.telemetryByDeviceId[device.id], state.clock)).length
  const selectedDevices = state.selectedDeviceIds
    .map((id) => state.devicesById[id])
    .filter((device): device is Device => Boolean(device))
  const selectedType = selectedDevices[0]?.deviceType
  const visibleOfSelectedType = devices.filter((device) => !selectedType || device.deviceType === selectedType)
  const allVisibleSelected = visibleOfSelectedType.length > 0
    && visibleOfSelectedType.every((device) => state.selectedDeviceIds.includes(device.id))

  return (
    <section aria-label="设备数据中心">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <DeviceEntitySwitchBar />
        <div className="flex items-center gap-3 text-xs font-semibold text-[#73827c]">
          <span>实时连接：{state.realtimeStatus === 'connected' ? '正常' : state.realtimeStatus}</span>
          {state.entityMode === 'device' && <span>{onlineCount}/{devices.length} 在线</span>}
          {state.entityMode === 'device' && (
            <button
              type="button"
              onClick={state.selectionMode ? state.exitSelectionMode : state.enterSelectionMode}
              className={`rounded-xl px-3 py-2 font-bold transition-[background-color,color,transform] duration-150 active:scale-[.97] ${
                state.selectionMode ? 'bg-[#243b33] text-white' : 'bg-[#e8f2ee] text-[#176b4d]'
              }`}
            >
              {state.selectionMode ? '退出选择' : '批量控制'}
            </button>
          )}
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-[#dfe8e3] bg-white/90 p-4 shadow-[0_8px_30px_rgb(17_48_38_/_4%)]">
        <div className="flex flex-wrap items-center gap-3">
          {state.entityMode === 'device' && <DeviceTypeSwitchBar />}
          <label className="relative min-w-52 flex-1">
            <span className="sr-only">搜索设备或网关</span>
            <input
              value={state.search}
              onChange={(event) => state.setSearch(event.target.value)}
              placeholder={state.entityMode === 'device' ? '搜索设备名称、ID 或地址' : '搜索网关名称、ID 或 Topic'}
              className="h-11 w-full rounded-xl border border-[#dbe5e0] bg-[#f8faf9] px-4 text-sm outline-none transition-[border-color,box-shadow] focus:border-[#4ba786] focus:shadow-[0_0_0_3px_rgb(75_167_134_/_13%)]"
            />
          </label>
          {state.entityMode === 'device' && (
            <select
              value={state.onlineFilter}
              onChange={(event) => state.setOnlineFilter(event.target.value as typeof state.onlineFilter)}
              aria-label="在线状态"
              className="h-11 rounded-xl border border-[#dbe5e0] bg-white px-3 text-sm font-semibold"
            >
              <option value="all">全部状态</option>
              <option value="online">仅在线</option>
              <option value="offline">仅离线</option>
            </select>
          )}
        </div>
      </div>

      {state.loadStatus === 'error' && (
        <div role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{state.error}</div>
      )}
      {state.loadStatus === 'loading' && (
        <div className="mb-4 h-1 overflow-hidden rounded-full bg-[#e3ece8]">
          <span className="block h-full w-1/3 animate-pulse rounded-full bg-[#36a77f]" />
        </div>
      )}

      {items.length === 0 ? <EmptyState entityMode={state.entityMode} /> : (
        <VirtuosoGrid
          style={{ height: 620 }}
          totalCount={items.length}
          components={{ List: GridList }}
          itemContent={(index) => state.entityMode === 'device'
            ? (
              <DeviceCard
                device={devices[index]}
                telemetry={state.telemetryByDeviceId[devices[index].id]}
                selectionMode={state.selectionMode}
                selected={state.selectedDeviceIds.includes(devices[index].id)}
                incompatible={Boolean(selectedType && devices[index].deviceType !== selectedType)}
              />
            )
            : <GatewayCard gateway={gateways[index]} />}
        />
      )}
      {state.selectionMode && (
        <div className="sticky bottom-5 z-30 mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/80 bg-[#163c2f]/95 px-5 py-4 text-white shadow-[0_20px_55px_rgb(9_39_29_/_28%)] backdrop-blur-xl motion-safe:animate-[control-dialog-in_.2s_cubic-bezier(.23,1,.32,1)]">
          <div>
            <strong className="block text-sm">
              {selectedDevices.length > 0
                ? `已选择 ${selectedDevices.length} 台${deviceTypeName[selectedDevices[0].deviceType]}`
                : '请选择需要控制的设备'}
            </strong>
            <span className="text-xs text-white/65">
              仅可选择同类型设备，单次最多 20 台
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={visibleOfSelectedType.length === 0}
              onClick={() => state.selectVisibleDeviceIds(
                allVisibleSelected ? [] : visibleOfSelectedType.map((device) => device.id),
              )}
              className="rounded-xl bg-white/10 px-3 py-2.5 text-sm font-bold transition-[background-color,transform,opacity] duration-150 hover:bg-white/15 active:scale-[.97] disabled:opacity-40"
            >
              {allVisibleSelected ? '取消全选' : '全选当前'}
            </button>
            <button
              type="button"
              disabled={selectedDevices.length === 0}
              onClick={() => setMultiControlOpen(true)}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#155c42] transition-[transform,opacity] duration-150 active:scale-[.97] disabled:opacity-45"
            >
              开始控制
            </button>
          </div>
        </div>
      )}
      <DetailDrawer controlDataSource={controlDataSource} />
      <DeviceControlDialog
        open={multiControlOpen}
        targets={selectedDevices}
        dataSource={controlDataSource}
        onClose={() => setMultiControlOpen(false)}
      />
    </section>
  )
}
