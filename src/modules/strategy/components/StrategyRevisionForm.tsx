import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { useStore } from 'zustand'
import {
  commandArgsAreValid,
  commandsFor,
  initialArgs,
} from '@/modules/device/control/commandCatalog'
import type { CommandInputSpec } from '@/modules/device/control/types'
import {
  deviceField,
  deviceFieldsFor,
  strategyOperatorOptions,
} from '@/modules/device/deviceFieldCatalog'
import type { Device, DeviceType } from '@/modules/device/types'
import {
  createEmptyControlAction,
  createEmptyDeviceCondition,
  createEmptyTimeCondition,
  createStrategyDraftStore,
  deviceGroupReferences,
  renameDeviceConditionGroup,
  renameTimeConditionGroup,
  serializeStrategyDraft,
  timeGroupReferences,
  validateStrategyDraft,
  type DraftAction,
  type StrategyDraftStore,
} from '../store/strategyDraftStore'
import type {
  DeviceCondition,
  RuntimeRevision,
  StrategyOperator,
  TimeCondition,
} from '../types'

export interface StrategyRevisionFormProps {
  initialValue?: RuntimeRevision | null
  mode: 'create' | 'edit'
  devices: Device[]
  saving?: boolean
  defaultZoneId?: string
  onChange?: (revision: RuntimeRevision, valid: boolean) => void
  onSubmit: (revision: RuntimeRevision) => Promise<void> | void
  onCancel: () => void
}

const DraftContext = createContext<StrategyDraftStore | null>(null)

function useDraft<T>(selector: (state: ReturnType<StrategyDraftStore['getState']>) => T) {
  const store = useContext(DraftContext)
  if (!store) throw new Error('StrategyRevisionForm draft context is missing')
  return useStore(store, selector)
}

const deviceTypeOptions: { value: DeviceType; label: string }[] = [
  { value: 'Access', label: '门禁' },
  { value: 'AirCondition', label: '空调' },
  { value: 'Sensor', label: '传感器' },
  { value: 'CircuitBreak', label: '断路器' },
  { value: 'Light', label: '照明' },
]

const weekdays = [
  { value: 'MONDAY', label: '一' },
  { value: 'TUESDAY', label: '二' },
  { value: 'WEDNESDAY', label: '三' },
  { value: 'THURSDAY', label: '四' },
  { value: 'FRIDAY', label: '五' },
  { value: 'SATURDAY', label: '六' },
  { value: 'SUNDAY', label: '日' },
]

const sectionLinks = [
  { id: 'strategy-basic', label: '基本信息', marker: '01' },
  { id: 'strategy-device-groups', label: '设备条件', marker: '02' },
  { id: 'strategy-time-groups', label: '时间条件', marker: '03' },
  { id: 'strategy-action-groups', label: '执行动作', marker: '04' },
  { id: 'strategy-summary', label: '检查发布', marker: '05' },
]

const fieldClass = 'h-11 min-w-0 w-full rounded-xl border border-[#d8e3de] bg-white px-3 text-sm text-[#24372f] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#54a685] focus:shadow-[0_0_0_3px_rgb(65_153_117_/_13%)] disabled:bg-[#eff4f2] disabled:text-[#77867f]'
const smallButton = 'rounded-lg px-3 py-2 text-xs font-bold transition-[background-color,color,transform,opacity] duration-150 active:scale-[.96] disabled:cursor-not-allowed disabled:opacity-35'

function nextName(prefix: string, names: string[]) {
  let index = 1
  while (names.includes(`${prefix} ${index}`)) index += 1
  return `${prefix} ${index}`
}

function localDateTime(iso: string | null) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.valueOf())) return ''
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.valueOf() - offset).toISOString().slice(0, 16)
}

function instant(value: string) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString()
}

function clockValue(value: string | null) {
  return value?.slice(0, 5) ?? ''
}

function clockPayload(value: string) {
  return value ? `${value}:00` : null
}

function Section({
  id,
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-28 rounded-[22px] border border-[#dbe5e0] bg-white p-5 shadow-[0_10px_34px_rgb(20_55_43_/_5%)] max-sm:p-4">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-extrabold tracking-[.14em] text-[#258364]">{eyebrow}</p>
          <h3 className="m-0 text-xl tracking-[-.02em] text-[#1e3129]">{title}</h3>
          <p className="mt-1.5 mb-0 max-w-2xl text-xs leading-5 text-[#718078]">{description}</p>
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

function EmptyGroupHint({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#cfdcd6] bg-[#f6f9f7] px-4 py-6 text-center text-sm text-[#718078]">
      {children}
    </div>
  )
}

function DeviceValueInput({
  condition,
  update,
}: {
  condition: DeviceCondition
  update: (recipe: (condition: DeviceCondition) => void) => void
}) {
  const spec = deviceField(condition.deviceType, condition.field)
  if (!spec) return <input disabled value="" placeholder="先选择属性" className={fieldClass} readOnly />
  if (spec.options) {
    return (
      <select value={condition.value} onChange={(event) => update((item) => { item.value = event.target.value })} className={fieldClass}>
        <option value="">选择值</option>
        {spec.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    )
  }
  return (
    <div className="relative">
      <input
        type="number"
        step="any"
        value={condition.value}
        onChange={(event) => update((item) => { item.value = event.target.value })}
        placeholder="输入数值"
        className={`${fieldClass} ${spec.unit ? 'pr-14' : ''}`}
      />
      {spec.unit && <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs font-bold text-[#829089]">{spec.unit}</span>}
    </div>
  )
}

function DeviceConditionRow({
  condition,
  index,
  devices,
  onUpdate,
  onMove,
  onRemove,
}: {
  condition: DeviceCondition
  index: number
  devices: Device[]
  onUpdate: (recipe: (condition: DeviceCondition) => void) => void
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
}) {
  const compatibleDevices = devices.filter((device) => device.deviceType === condition.deviceType)
  const selectedOutsideScope = condition.deviceId
    && !devices.some((device) => device.id === condition.deviceId)
  const spec = deviceField(condition.deviceType, condition.field)
  const operators = spec ? strategyOperatorOptions[spec.kind] : strategyOperatorOptions.number

  const changeType = (deviceType: DeviceType) => onUpdate((item) => {
    item.deviceType = deviceType
    item.deviceId = ''
    item.field = ''
    item.operator = 'EQ'
    item.value = ''
  })

  const changeDevice = (deviceId: string) => onUpdate((item) => {
    const device = devices.find((candidate) => candidate.id === deviceId)
    if (device && device.deviceType !== item.deviceType) {
      item.deviceType = device.deviceType
      item.field = ''
      item.operator = 'EQ'
      item.value = ''
    }
    item.deviceId = deviceId
  })

  const changeField = (field: string) => onUpdate((item) => {
    item.field = field
    item.operator = 'EQ'
    item.value = ''
  })

  return (
    <div className="rounded-2xl border border-[#dde6e2] bg-[#fbfcfb] p-3.5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-[#e4f3ed] text-[11px] font-extrabold text-[#176d4f]">{index + 1}</span>
          {index > 0 && (
            <select
              aria-label={`条件 ${index + 1} 与前一项的关系`}
              value={condition.logicToPrevious}
              onChange={(event) => onUpdate((item) => { item.logicToPrevious = event.target.value as 'AND' | 'OR' })}
              className="h-8 rounded-lg border border-[#cfe0d8] bg-[#edf7f3] px-2 text-xs font-bold text-[#176d4f] outline-none"
            >
              <option value="AND">并且</option>
              <option value="OR">或者</option>
            </select>
          )}
          {index === 0 && <span className="text-xs font-bold text-[#7b8983]">起始条件</span>}
        </div>
        <div className="flex gap-1">
          <button type="button" aria-label="上移条件" onClick={() => onMove(-1)} disabled={index === 0} className={`${smallButton} bg-[#edf3f0] text-[#607168]`}>↑</button>
          <button type="button" aria-label="下移条件" onClick={() => onMove(1)} className={`${smallButton} bg-[#edf3f0] text-[#607168]`}>↓</button>
          <button type="button" onClick={onRemove} className={`${smallButton} bg-red-50 text-red-700`}>删除</button>
        </div>
      </div>
      <div className="grid grid-cols-[.8fr_1.25fr_1fr_.8fr_1fr] gap-2.5 max-[1080px]:grid-cols-2 max-sm:grid-cols-1">
        <label className="grid min-w-0 gap-1 text-[11px] font-bold text-[#75847d]">设备类型
          <select value={condition.deviceType} onChange={(event) => changeType(event.target.value as DeviceType)} className={fieldClass}>
            {deviceTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="grid min-w-0 gap-1 text-[11px] font-bold text-[#75847d]">目标设备
          <select value={condition.deviceId} onChange={(event) => changeDevice(event.target.value)} className={fieldClass}>
            <option value="">选择设备</option>
            {selectedOutsideScope && <option value={condition.deviceId}>当前筛选外 · {condition.deviceId}</option>}
            {compatibleDevices.map((device) => <option key={device.id} value={device.id}>{device.deviceName}</option>)}
          </select>
        </label>
        <label className="grid min-w-0 gap-1 text-[11px] font-bold text-[#75847d]">遥测属性
          <select value={condition.field} onChange={(event) => changeField(event.target.value)} className={fieldClass}>
            <option value="">选择属性</option>
            {deviceFieldsFor(condition.deviceType).map((field) => <option key={field.field} value={field.field}>{field.label}</option>)}
          </select>
        </label>
        <label className="grid min-w-0 gap-1 text-[11px] font-bold text-[#75847d]">比较方式
          <select value={condition.operator} onChange={(event) => onUpdate((item) => { item.operator = event.target.value as StrategyOperator })} className={fieldClass}>
            {operators.map((operator) => <option key={operator.value} value={operator.value}>{operator.label}</option>)}
          </select>
        </label>
        <label className="grid min-w-0 gap-1 text-[11px] font-bold text-[#75847d]">目标值
          <DeviceValueInput condition={condition} update={onUpdate} />
        </label>
      </div>
    </div>
  )
}

function DeviceGroups({ devices }: { devices: Device[] }) {
  const draft = useDraft((state) => state.draft)
  const update = useDraft((state) => state.update)

  const addGroup = () => update((next) => {
    next.deviceConditionGroups.push({
      groupId: nextName('设备条件组', next.deviceConditionGroups.map((group) => group.groupId)),
      conditions: [],
    })
  })

  return (
    <Section
      id="strategy-device-groups"
      eyebrow="DEVICE CONDITIONS"
      title="设备条件组"
      description="同组条件严格按照显示顺序从左向右计算；空组表示始终满足。"
      action={<button type="button" onClick={addGroup} className={`${smallButton} shrink-0 bg-[#147a56] text-white`}>添加条件组</button>}
    >
      <div className="grid gap-4">
        {draft.deviceConditionGroups.map((group, groupIndex) => {
          const references = deviceGroupReferences(draft, group.groupId)
          return (
            <article key={groupIndex} className="rounded-[18px] border border-[#d8e3de] bg-[#f4f8f6] p-4">
              <div className="mb-4 flex flex-wrap items-end gap-3">
                <label className="grid min-w-[220px] flex-1 gap-1 text-[11px] font-bold text-[#75847d]">条件组名称
                  <input
                    value={group.groupId}
                    onChange={(event) => {
                      const nextId = event.target.value
                      update((next) => renameDeviceConditionGroup(next, next.deviceConditionGroups[groupIndex].groupId, nextId))
                    }}
                    className={fieldClass}
                  />
                </label>
                <span className="mb-2 text-[11px] font-semibold text-[#7b8983]">
                  {references.length ? `被 ${references.join('、')} 引用` : '尚未被动作引用'}
                </span>
                <button
                  type="button"
                  disabled={references.length > 0 || draft.deviceConditionGroups.length === 1}
                  title={references.length ? '请先修改引用此组的动作组' : undefined}
                  onClick={() => update((next) => { next.deviceConditionGroups.splice(groupIndex, 1) })}
                  className={`${smallButton} mb-0.5 bg-red-50 text-red-700`}
                >
                  删除组
                </button>
              </div>
              {group.conditions.length === 0 ? (
                <EmptyGroupHint>没有设备条件，此组始终满足。</EmptyGroupHint>
              ) : (
                <div className="grid gap-2.5">
                  {group.conditions.map((condition, conditionIndex) => (
                    <DeviceConditionRow
                      key={condition.conditionId}
                      condition={condition}
                      index={conditionIndex}
                      devices={devices}
                      onUpdate={(recipe) => update((next) => recipe(next.deviceConditionGroups[groupIndex].conditions[conditionIndex]))}
                      onMove={(direction) => update((next) => {
                        const conditions = next.deviceConditionGroups[groupIndex].conditions
                        const target = conditionIndex + direction
                        if (target < 0 || target >= conditions.length) return
                        const [moved] = conditions.splice(conditionIndex, 1)
                        conditions.splice(target, 0, moved)
                      })}
                      onRemove={() => update((next) => { next.deviceConditionGroups[groupIndex].conditions.splice(conditionIndex, 1) })}
                    />
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => update((next) => { next.deviceConditionGroups[groupIndex].conditions.push(createEmptyDeviceCondition()) })}
                className={`${smallButton} mt-3 bg-[#e2f2eb] text-[#146c4d]`}
              >
                ＋ 添加设备条件
              </button>
            </article>
          )
        })}
      </div>
    </Section>
  )
}

function timeZones(defaultZoneId: string) {
  const fallback = [defaultZoneId, 'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Tokyo', 'UTC']
  const supportedValuesOf = (Intl as typeof Intl & {
    supportedValuesOf?: (key: 'timeZone') => string[]
  }).supportedValuesOf
  return [...new Set(supportedValuesOf?.('timeZone') ?? fallback)]
}

function TimeConditionCard({
  condition,
  index,
  zones,
  onUpdate,
  onRemove,
}: {
  condition: TimeCondition
  index: number
  zones: string[]
  onUpdate: (recipe: (condition: TimeCondition) => void) => void
  onRemove: () => void
}) {
  const toggleWeekday = (value: string) => onUpdate((item) => {
    item.weekdays = item.weekdays.includes(value)
      ? item.weekdays.filter((day) => day !== value)
      : [...item.weekdays, value]
  })

  return (
    <div className="rounded-2xl border border-[#dde6e2] bg-[#fbfcfb] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-[#e4f3ed] text-[11px] font-extrabold text-[#176d4f]">{index + 1}</span>
          {index > 0 && <span className="rounded-lg bg-[#edf7f3] px-2 py-1 text-[11px] font-extrabold text-[#176d4f]">或者</span>}
          <div className="grid grid-cols-2 rounded-xl bg-[#e9efec] p-1">
            {([
              ['WINDOW', '时间段'],
              ['TIME_POINT', '时间点'],
            ] as const).map(([value, label]) => (
              <button
                type="button"
                key={value}
                onClick={() => onUpdate((item) => {
                  item.type = value
                  if (value === 'WINDOW') {
                    item.startTime ??= '08:00:00'
                    item.endTime ??= '18:00:00'
                    item.timePoint = null
                  } else {
                    item.timePoint ??= '08:00:00'
                    item.startTime = null
                    item.endTime = null
                  }
                })}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[.97] ${condition.type === value ? 'bg-white text-[#176d4f] shadow-sm' : 'text-[#74827c]'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <button type="button" onClick={onRemove} className={`${smallButton} bg-red-50 text-red-700`}>删除</button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <label className="grid gap-1 text-[11px] font-bold text-[#75847d]">开始日期（可留空）
          <input type="date" value={condition.startDate ?? ''} onChange={(event) => onUpdate((item) => { item.startDate = event.target.value || null })} className={fieldClass} />
        </label>
        <label className="grid gap-1 text-[11px] font-bold text-[#75847d]">结束日期（可留空）
          <input type="date" value={condition.endDate ?? ''} onChange={(event) => onUpdate((item) => { item.endDate = event.target.value || null })} className={fieldClass} />
        </label>
      </div>
      <fieldset className="mt-3 min-w-0 border-0 p-0">
        <legend className="mb-1 text-[11px] font-bold text-[#75847d]">星期（不选择表示每天）</legend>
        <div className="grid grid-cols-7 rounded-xl bg-[#e9efec] p-1">
          {weekdays.map((day) => {
            const selected = condition.weekdays.includes(day.value)
            return (
              <button
                type="button"
                aria-pressed={selected}
                key={day.value}
                onClick={() => toggleWeekday(day.value)}
                className={`rounded-lg py-2 text-xs font-bold transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[.96] ${selected ? 'bg-white text-[#176d4f] shadow-sm' : 'text-[#77857f]'}`}
              >
                {day.label}
              </button>
            )
          })}
        </div>
      </fieldset>
      <div className={`mt-3 grid gap-3 ${condition.type === 'WINDOW' ? 'grid-cols-2' : 'grid-cols-1'} max-sm:grid-cols-1`}>
        {condition.type === 'WINDOW' ? (
          <>
            <label className="grid gap-1 text-[11px] font-bold text-[#75847d]">开始时间
              <input type="time" value={clockValue(condition.startTime)} onChange={(event) => onUpdate((item) => { item.startTime = clockPayload(event.target.value) })} className={fieldClass} />
            </label>
            <label className="grid gap-1 text-[11px] font-bold text-[#75847d]">结束时间
              <input type="time" value={clockValue(condition.endTime)} onChange={(event) => onUpdate((item) => { item.endTime = clockPayload(event.target.value) })} className={fieldClass} />
            </label>
          </>
        ) : (
          <label className="grid gap-1 text-[11px] font-bold text-[#75847d]">指定时间点
            <input type="time" value={clockValue(condition.timePoint)} onChange={(event) => onUpdate((item) => { item.timePoint = clockPayload(event.target.value) })} className={fieldClass} />
          </label>
        )}
      </div>
      <details className="mt-3 rounded-xl bg-[#f0f5f2] px-3 py-2 text-xs text-[#66776f]">
        <summary className="cursor-pointer font-bold">高级设置 · 时区</summary>
        <label className="mt-3 grid gap-1 text-[11px] font-bold text-[#75847d]">IANA 时区
          <select value={condition.zoneId} onChange={(event) => onUpdate((item) => { item.zoneId = event.target.value })} className={fieldClass}>
            {!zones.includes(condition.zoneId) && <option value={condition.zoneId}>{condition.zoneId}</option>}
            {zones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
          </select>
        </label>
      </details>
    </div>
  )
}

function TimeGroups({ defaultZoneId }: { defaultZoneId: string }) {
  const draft = useDraft((state) => state.draft)
  const update = useDraft((state) => state.update)
  const zones = useMemo(() => timeZones(defaultZoneId), [defaultZoneId])

  return (
    <Section
      id="strategy-time-groups"
      eyebrow="TIME CONDITIONS"
      title="时间条件组"
      description="组内任一时间条件成立即可；空组表示不限制时间。跨午夜时间段会自动延续到次日。"
      action={(
        <button type="button" onClick={() => update((next) => {
          next.timeConditionGroups.push({
            groupId: nextName('时间条件组', next.timeConditionGroups.map((group) => group.groupId)),
            conditions: [],
          })
        })} className={`${smallButton} shrink-0 bg-[#147a56] text-white`}>添加时间组</button>
      )}
    >
      <div className="grid gap-4">
        {draft.timeConditionGroups.map((group, groupIndex) => {
          const references = timeGroupReferences(draft, group.groupId)
          return (
            <article key={groupIndex} className="rounded-[18px] border border-[#d8e3de] bg-[#f4f8f6] p-4">
              <div className="mb-4 flex flex-wrap items-end gap-3">
                <label className="grid min-w-[220px] flex-1 gap-1 text-[11px] font-bold text-[#75847d]">时间组名称
                  <input
                    value={group.groupId}
                    onChange={(event) => {
                      const nextId = event.target.value
                      update((next) => renameTimeConditionGroup(next, next.timeConditionGroups[groupIndex].groupId, nextId))
                    }}
                    className={fieldClass}
                  />
                </label>
                <span className="mb-2 text-[11px] font-semibold text-[#7b8983]">
                  {references.length ? `被 ${references.join('、')} 引用` : '尚未被动作引用'}
                </span>
                <button
                  type="button"
                  disabled={references.length > 0 || draft.timeConditionGroups.length === 1}
                  title={references.length ? '请先修改引用此组的动作组' : undefined}
                  onClick={() => update((next) => { next.timeConditionGroups.splice(groupIndex, 1) })}
                  className={`${smallButton} mb-0.5 bg-red-50 text-red-700`}
                >
                  删除组
                </button>
              </div>
              {group.conditions.length === 0 ? (
                <EmptyGroupHint>没有时间条件，此组始终满足。</EmptyGroupHint>
              ) : (
                <div className="grid gap-2.5">
                  {group.conditions.map((condition, conditionIndex) => (
                    <TimeConditionCard
                      key={condition.conditionId}
                      condition={condition}
                      index={conditionIndex}
                      zones={zones}
                      onUpdate={(recipe) => update((next) => recipe(next.timeConditionGroups[groupIndex].conditions[conditionIndex]))}
                      onRemove={() => update((next) => { next.timeConditionGroups[groupIndex].conditions.splice(conditionIndex, 1) })}
                    />
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => update((next) => { next.timeConditionGroups[groupIndex].conditions.push(createEmptyTimeCondition(defaultZoneId)) })}
                className={`${smallButton} mt-3 bg-[#e2f2eb] text-[#146c4d]`}
              >
                ＋ 添加时间条件
              </button>
            </article>
          )
        })}
      </div>
    </Section>
  )
}

function SegmentedParameter({
  input,
  value,
  onChange,
}: {
  input: CommandInputSpec
  value: number
  onChange: (value: number) => void
}) {
  const options = input.options ?? []
  return (
    <fieldset className="min-w-0 rounded-xl bg-[#f0f5f2] p-3">
      <legend className="px-1 text-[11px] font-bold text-[#75847d]">{input.label}</legend>
      <div className="mt-1 grid rounded-xl bg-[#e4ebe7] p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}>
        {options.map((option) => (
          <button
            type="button"
            key={option.value}
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
            className={`min-w-0 truncate rounded-lg px-1.5 py-2 text-[11px] font-bold transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[.96] ${option.value === value ? 'bg-white text-[#176d4f] shadow-sm' : 'text-[#76857e]'}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function RangeParameter({
  input,
  value,
  onChange,
}: {
  input: CommandInputSpec
  value: number
  onChange: (value: number) => void
}) {
  const options = input.options
  const optionIndex = options ? Math.max(0, options.findIndex((option) => option.value === value)) : value
  const min = options ? 0 : input.min ?? 0
  const max = options ? options.length - 1 : input.max ?? 255
  const display = options?.[optionIndex]?.label ?? `${value}${input.unit ? ` ${input.unit}` : ''}`
  return (
    <label className="grid gap-2 rounded-xl bg-[#f0f5f2] p-3 text-[11px] font-bold text-[#75847d]">
      <span className="flex justify-between gap-3"><span>{input.label}</span><strong className="text-[#176d4f]">{display}</strong></span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={optionIndex}
        onChange={(event) => {
          const next = Number(event.target.value)
          onChange(options ? options[next].value : next)
        }}
        className="accent-[#16805a]"
      />
    </label>
  )
}

function ControlActionCard({
  action,
  devices,
  onUpdate,
  onDuplicate,
  onRemove,
}: {
  action: DraftAction
  devices: Device[]
  onUpdate: (recipe: (action: DraftAction) => void) => void
  onDuplicate: () => void
  onRemove: () => void
}) {
  if (action.type === 'Report') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <strong className="text-sm text-amber-900">通知动作（只读保留）</strong>
            <p className="mt-1 mb-0 text-xs leading-5 text-amber-800">通知通道尚未接入。该既有配置会原样保存，但当前不会实际发送。</p>
          </div>
          <button type="button" onClick={onRemove} className={`${smallButton} bg-white text-red-700`}>移除</button>
        </div>
      </div>
    )
  }

  const selectedDevice = devices.find((device) => device.id === action.control.deviceId)
  const selectedOutsideScope = action.control.deviceId && !selectedDevice
  const specs = commandsFor(action.control.type)
  const selectedSpec = specs.find((spec) => spec.commandLine === action.control.commandLine) ?? specs[0]

  const chooseDevice = (deviceId: string) => onUpdate((item) => {
    if (item.type !== 'Control') return
    const device = devices.find((candidate) => candidate.id === deviceId)
    const nextType = device?.deviceType ?? item.control.type
    const firstCommand = commandsFor(nextType)[0]
    item.control = {
      type: nextType,
      deviceId,
      commandLine: firstCommand.commandLine,
      args: initialArgs(firstCommand),
    }
  })

  const chooseCommand = (commandLine: string) => onUpdate((item) => {
    if (item.type !== 'Control') return
    const spec = commandsFor(item.control.type).find((candidate) => candidate.commandLine === commandLine)
    if (!spec) return
    item.control.commandLine = spec.commandLine
    item.control.args = initialArgs(spec)
  })

  return (
    <div className="rounded-2xl border border-[#dde6e2] bg-[#fbfcfb] p-4">
      <div className="grid grid-cols-[1.2fr_1fr_auto] items-end gap-3 max-sm:grid-cols-1">
        <label className="grid min-w-0 gap-1 text-[11px] font-bold text-[#75847d]">控制设备
          <select value={action.control.deviceId} onChange={(event) => chooseDevice(event.target.value)} className={fieldClass}>
            <option value="">选择设备</option>
            {selectedOutsideScope && <option value={action.control.deviceId}>当前筛选外 · {action.control.deviceId}</option>}
            {devices.map((device) => <option key={device.id} value={device.id}>{device.deviceName} · {deviceTypeOptions.find((item) => item.value === device.deviceType)?.label}</option>)}
          </select>
        </label>
        <label className="grid min-w-0 gap-1 text-[11px] font-bold text-[#75847d]">执行指令
          <select value={selectedSpec.commandLine} onChange={(event) => chooseCommand(event.target.value)} className={fieldClass}>
            {specs.map((spec) => <option key={spec.commandLine} value={spec.commandLine}>{spec.label}</option>)}
          </select>
        </label>
        <div className="flex gap-1.5 pb-0.5">
          <button type="button" onClick={onDuplicate} className={`${smallButton} bg-[#edf3f0] text-[#607168]`}>复制</button>
          <button type="button" onClick={onRemove} className={`${smallButton} bg-red-50 text-red-700`}>删除</button>
        </div>
      </div>
      <p className="mt-2 mb-0 text-xs leading-5 text-[#718078]">{selectedSpec.description}</p>
      {selectedSpec.inputs.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
          {selectedSpec.inputs.map((input, inputIndex) => {
            const value = action.control.args[inputIndex] ?? initialArgs(selectedSpec)[inputIndex]
            const updateValue = (nextValue: number) => onUpdate((item) => {
              if (item.type !== 'Control') return
              item.control.args[inputIndex] = nextValue
            })
            return input.options && input.options.length <= 5
              ? <SegmentedParameter key={input.name} input={input} value={value} onChange={updateValue} />
              : <RangeParameter key={input.name} input={input} value={value} onChange={updateValue} />
          })}
        </div>
      )}
      {!commandArgsAreValid(selectedSpec, action.control.args) && (
        <p className="mt-3 mb-0 text-xs font-bold text-red-700">请补充有效参数；空调增强控制至少修改一项。</p>
      )}
    </div>
  )
}

function ActionGroups({ devices }: { devices: Device[] }) {
  const draft = useDraft((state) => state.draft)
  const update = useDraft((state) => state.update)
  return (
    <Section
      id="strategy-action-groups"
      eyebrow="ACTIONS"
      title="执行动作"
      description="设备条件组与时间条件组同时满足时，按顺序发送组内控制指令。通知能力暂未接入。"
      action={(
        <button type="button" onClick={() => update((next) => {
          next.actionGroups.push({
            actionGroupId: nextName('执行动作', next.actionGroups.map((group) => group.actionGroupId)),
            deviceConditionGroupId: next.deviceConditionGroups[0]?.groupId ?? '',
            timeConditionGroupId: next.timeConditionGroups[0]?.groupId ?? '',
            actions: [],
          })
        })} className={`${smallButton} shrink-0 bg-[#147a56] text-white`}>添加动作组</button>
      )}
    >
      <div className="grid gap-4">
        {draft.actionGroups.map((group, groupIndex) => (
          <article key={groupIndex} className="rounded-[18px] border border-[#d8e3de] bg-[#f4f8f6] p-4">
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-3 max-[1080px]:grid-cols-2 max-sm:grid-cols-1">
              <label className="grid min-w-0 gap-1 text-[11px] font-bold text-[#75847d]">动作组名称
                <input value={group.actionGroupId} onChange={(event) => update((next) => { next.actionGroups[groupIndex].actionGroupId = event.target.value })} className={fieldClass} />
              </label>
              <label className="grid min-w-0 gap-1 text-[11px] font-bold text-[#75847d]">设备条件组
                <select value={group.deviceConditionGroupId} onChange={(event) => update((next) => { next.actionGroups[groupIndex].deviceConditionGroupId = event.target.value })} className={fieldClass}>
                  {draft.deviceConditionGroups.map((item) => <option key={item.groupId} value={item.groupId}>{item.groupId}</option>)}
                </select>
              </label>
              <label className="grid min-w-0 gap-1 text-[11px] font-bold text-[#75847d]">时间条件组
                <select value={group.timeConditionGroupId} onChange={(event) => update((next) => { next.actionGroups[groupIndex].timeConditionGroupId = event.target.value })} className={fieldClass}>
                  {draft.timeConditionGroups.map((item) => <option key={item.groupId} value={item.groupId}>{item.groupId}</option>)}
                </select>
              </label>
              <button type="button" onClick={() => update((next) => { next.actionGroups.splice(groupIndex, 1) })} className={`${smallButton} mb-0.5 bg-red-50 text-red-700`}>删除组</button>
            </div>
            <p className="mt-3 mb-3 rounded-xl bg-[#e5f2ec] px-3 py-2 text-xs font-semibold text-[#31604f]">
              当“{group.deviceConditionGroupId || '未选择'}”并且“{group.timeConditionGroupId || '未选择'}”满足时执行
            </p>
            {group.actions.length === 0 ? (
              <EmptyGroupHint>尚未设置动作。至少添加一个设备控制动作。</EmptyGroupHint>
            ) : (
              <div className="grid gap-2.5">
                {group.actions.map((action, actionIndex) => (
                  <ControlActionCard
                    key={action._key}
                    action={action}
                    devices={devices}
                    onUpdate={(recipe) => update((next) => recipe(next.actionGroups[groupIndex].actions[actionIndex]))}
                    onDuplicate={() => update((next) => {
                      const copy = structuredClone(next.actionGroups[groupIndex].actions[actionIndex])
                      copy._key = `${copy._key}-copy-${Date.now()}`
                      next.actionGroups[groupIndex].actions.splice(actionIndex + 1, 0, copy)
                    })}
                    onRemove={() => update((next) => { next.actionGroups[groupIndex].actions.splice(actionIndex, 1) })}
                  />
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => update((next) => {
                const type = devices[0]?.deviceType ?? 'AirCondition'
                const action = createEmptyControlAction(type)
                if (action.type === 'Control' && devices[0]) action.control.deviceId = devices[0].id
                next.actionGroups[groupIndex].actions.push(action)
              })}
              className={`${smallButton} mt-3 bg-[#e2f2eb] text-[#146c4d]`}
            >
              ＋ 添加控制动作
            </button>
          </article>
        ))}
      </div>
    </Section>
  )
}

function BasicSection({ mode }: { mode: 'create' | 'edit' }) {
  const draft = useDraft((state) => state.draft)
  const update = useDraft((state) => state.update)
  return (
    <Section
      id="strategy-basic"
      eyebrow="BASIC"
      title="基本信息"
      description="策略标识创建后不可修改；新策略默认停用，确认配置无误后再从列表启用。"
    >
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <label className="grid gap-1 text-[11px] font-bold text-[#75847d]">策略标识
          <input
            value={draft.runtimeId}
            disabled={mode === 'edit'}
            onChange={(event) => update((next) => { next.runtimeId = event.target.value })}
            placeholder="例如 night-air-condition"
            className={fieldClass}
          />
        </label>
        <label className="flex min-h-[64px] items-center justify-between gap-4 rounded-xl border border-[#d8e3de] bg-[#f7faf8] px-4">
          <span><strong className="block text-sm text-[#263a32]">保存后启用</strong><small className="text-[11px] text-[#7a8982]">启用后会参与实时规则推演</small></span>
          <input type="checkbox" checked={draft.enabled} onChange={(event) => update((next) => { next.enabled = event.target.checked })} className="size-5 accent-[#16805a]" />
        </label>
        <label className="grid gap-1 text-[11px] font-bold text-[#75847d]">生效时间（可留空）
          <input type="datetime-local" value={localDateTime(draft.activeFrom)} onChange={(event) => update((next) => { next.activeFrom = instant(event.target.value) })} className={fieldClass} />
        </label>
        <label className="grid gap-1 text-[11px] font-bold text-[#75847d]">结束时间（可留空）
          <input type="datetime-local" value={localDateTime(draft.activeUntil)} onChange={(event) => update((next) => { next.activeUntil = instant(event.target.value) })} className={fieldClass} />
        </label>
      </div>
    </Section>
  )
}

function SummarySection() {
  const draft = useDraft((state) => state.draft)
  const issues = validateStrategyDraft(draft)
  const controlActions = draft.actionGroups.flatMap((group) => group.actions).filter((action) => action.type === 'Control')
  return (
    <Section
      id="strategy-summary"
      eyebrow="REVIEW"
      title="检查发布"
      description="这里展示最终会提交给规则引擎的结构摘要；不会要求用户编辑 JSON。"
    >
      <div className="grid grid-cols-4 gap-2.5 max-sm:grid-cols-2">
        {[
          ['设备条件组', draft.deviceConditionGroups.length],
          ['时间条件组', draft.timeConditionGroups.length],
          ['动作组', draft.actionGroups.length],
          ['控制动作', controlActions.length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-[#eef5f2] p-3"><small className="block text-[10px] font-bold text-[#7a8982]">{label}</small><strong className="mt-1 block text-xl text-[#1f3b30]">{value}</strong></div>
        ))}
      </div>
      {issues.length === 0 ? (
        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">配置完整，可以保存。</div>
      ) : (
        <div className="mt-4 rounded-xl bg-red-50 p-4">
          <strong className="text-sm text-red-800">还有 {issues.length} 项需要处理</strong>
          <ul className="mt-2 mb-0 grid gap-1 pl-5 text-xs leading-5 text-red-700">
            {issues.map((issue, index) => <li key={`${issue.path}-${index}`}>{issue.message}</li>)}
          </ul>
        </div>
      )}
    </Section>
  )
}

function StrategyFormContent({
  mode,
  devices,
  saving,
  defaultZoneId,
  onChange,
  onSubmit,
  onCancel,
}: Omit<StrategyRevisionFormProps, 'initialValue'> & { defaultZoneId: string }) {
  const draft = useDraft((state) => state.draft)
  const dirty = useDraft((state) => state.dirty)
  const markClean = useDraft((state) => state.markClean)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const issues = useMemo(() => validateStrategyDraft(draft), [draft])
  const revision = useMemo(() => serializeStrategyDraft(draft), [draft])

  useEffect(() => {
    onChange?.(revision, issues.length === 0)
  }, [issues.length, onChange, revision])

  const cancel = () => {
    if (dirty && !window.confirm('尚有未保存的修改，确定关闭编辑器吗？')) return
    onCancel()
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitError(null)
    if (issues.length > 0) {
      document.getElementById('strategy-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    try {
      await onSubmit(revision)
      markClean()
    } catch (cause) {
      setSubmitError(cause instanceof Error ? cause.message : '保存策略失败')
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="absolute inset-y-0 right-0 flex w-[min(1240px,calc(100%-2rem))] flex-col overflow-hidden border-l border-white/70 bg-[#f5f8f6]/96 shadow-[-28px_0_80px_rgb(8_39_29_/_22%)] backdrop-blur-2xl motion-safe:animate-[drawer-in_.24s_cubic-bezier(.23,1,.32,1)] max-sm:w-full">
      <header className="z-20 flex shrink-0 items-start justify-between gap-4 bg-white/72 px-6 pt-6 pb-4 backdrop-blur-2xl max-sm:px-4">
        <div>
          <p className="mb-1 text-[10px] font-extrabold tracking-[.14em] text-[#18825c]">RULE BUILDER</p>
          <h2 className="m-0 text-2xl tracking-[-.025em]">{mode === 'edit' ? '编辑智能策略' : '新增智能策略'}</h2>
          <p className="mt-1 mb-0 text-xs text-[#74827c]">通过条件与动作构建规则，无需接触底层 JSON。</p>
        </div>
        <button type="button" disabled={saving} onClick={cancel} className={`${smallButton} bg-[#eaf1ee] px-4 py-2.5 text-[#31473e]`}>关闭</button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-28 max-sm:px-4">
        <div className="mx-auto grid max-w-[1160px] grid-cols-[190px_minmax(0,1fr)] items-start gap-5 pt-3 max-[900px]:grid-cols-1">
          <nav className="sticky top-3 grid gap-1 rounded-2xl border border-[#dbe5e0] bg-white/80 p-2 shadow-[0_10px_30px_rgb(20_55_43_/_6%)] backdrop-blur-xl max-[900px]:static max-[900px]:grid-cols-5 max-sm:grid-cols-2" aria-label="策略配置章节">
            {sectionLinks.map((link) => (
              <a key={link.id} href={`#${link.id}`} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-[#617269] no-underline transition-[background-color,color,transform] duration-150 hover:bg-[#edf6f2] hover:text-[#176d4f] active:scale-[.98]">
                <span className="text-[9px] font-extrabold text-[#9aa8a2]">{link.marker}</span>{link.label}
              </a>
            ))}
          </nav>
          <div className="grid min-w-0 gap-5">
            <BasicSection mode={mode} />
            <DeviceGroups devices={devices} />
            <TimeGroups defaultZoneId={defaultZoneId} />
            <ActionGroups devices={devices} />
            <SummarySection />
            {submitError && <p role="alert" className="m-0 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{submitError}</p>}
          </div>
        </div>
      </div>
      <footer className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-4 border-t border-white/80 bg-white/90 px-6 py-4 shadow-[0_-12px_32px_rgb(24_57_44_/_8%)] backdrop-blur-xl max-sm:px-4">
        <p className="m-0 text-xs text-[#78867f]">{issues.length ? `还有 ${issues.length} 项配置需要处理` : dirty ? '修改尚未保存' : '配置未发生变化'}</p>
        <div className="flex shrink-0 gap-2">
          <button type="button" disabled={saving} onClick={cancel} className={`${smallButton} bg-[#edf3f0] px-5 py-3 text-[#52655c]`}>取消</button>
          <button type="submit" disabled={saving || issues.length > 0} className={`${smallButton} inline-flex min-w-28 items-center justify-center bg-[#147a56] px-5 py-3 text-white`}>
            {saving ? '正在保存…' : mode === 'edit' ? '保存修改' : '创建策略'}
          </button>
        </div>
      </footer>
    </form>
  )
}

function StrategyBackdrop({
  saving,
  onCancel,
}: {
  saving: boolean
  onCancel: () => void
}) {
  const dirty = useDraft((state) => state.dirty)
  return (
    <button
      type="button"
      aria-label="关闭策略编辑器"
      disabled={saving}
      onClick={() => {
        if (dirty && !window.confirm('尚有未保存的修改，确定关闭编辑器吗？')) return
        onCancel()
      }}
      className="absolute inset-0 bg-[#092018]/32 backdrop-blur-[3px]"
    />
  )
}

export function StrategyRevisionForm({
  initialValue = null,
  mode,
  devices,
  saving = false,
  defaultZoneId = 'Asia/Shanghai',
  onChange,
  onSubmit,
  onCancel,
}: StrategyRevisionFormProps) {
  const [store] = useState(() => createStrategyDraftStore(initialValue))
  return (
    <DraftContext.Provider value={store}>
      <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={mode === 'edit' ? '编辑智能策略' : '新增智能策略'}>
        <StrategyBackdrop saving={saving} onCancel={onCancel} />
        <StrategyFormContent
          mode={mode}
          devices={devices}
          saving={saving}
          defaultZoneId={defaultZoneId}
          onChange={onChange}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      </div>
    </DraftContext.Provider>
  )
}
