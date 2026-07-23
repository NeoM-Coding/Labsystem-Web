import { useDeviceStore } from '../store/deviceStore'
import type { DeviceEntityMode, DeviceTypeFilter } from '../types'

const entityOptions: { value: DeviceEntityMode; label: string }[] = [
  { value: 'device', label: '设备' },
  { value: 'gateway', label: '网关' },
]

const typeOptions: { value: DeviceTypeFilter; label: string }[] = [
  { value: 'all', label: '全部类型' },
  { value: 'Access', label: '门禁' },
  { value: 'AirCondition', label: '空调' },
  { value: 'Sensor', label: '传感器' },
  { value: 'CircuitBreak', label: '断路器' },
  { value: 'Light', label: '照明' },
]

function SegmentedBar<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div
      className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-[#dce6e1] bg-[#edf3f0] p-1"
      role="group"
      aria-label={label}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[.97] ${
              active
                ? 'bg-white text-[#125f45] shadow-[0_1px_5px_rgb(18_55_43_/_12%)]'
                : 'text-[#65766f] hover:text-[#263a32]'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function DeviceEntitySwitchBar() {
  const value = useDeviceStore((state) => state.entityMode)
  const onChange = useDeviceStore((state) => state.setEntityMode)
  return <SegmentedBar label="数据对象" value={value} options={entityOptions} onChange={onChange} />
}

export function DeviceTypeSwitchBar() {
  const value = useDeviceStore((state) => state.deviceTypeFilter)
  const onChange = useDeviceStore((state) => state.setDeviceTypeFilter)
  return <SegmentedBar label="设备类型" value={value} options={typeOptions} onChange={onChange} />
}
