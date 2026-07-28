import { useEffect, useMemo, useState } from 'react'
import { deviceControlDataSource } from '../api/deviceControl'
import { commandArgsAreValid, commandsFor, initialArgs } from '../control/commandCatalog'
import type {
  CommandInputSpec,
  DeviceCommandResult,
  DeviceControlDialogProps,
} from '../control/types'

const typeName = {
  Access: '门禁',
  AirCondition: '空调',
  Sensor: '传感器',
  CircuitBreak: '断路器',
  Light: '照明',
}

function ProgressRing() {
  return (
    <span
      aria-hidden="true"
      className="h-5 w-5 animate-spin rounded-full border-2 border-white/35 border-t-white"
    />
  )
}

interface ParameterSliderProps {
  input: CommandInputSpec
  value: number
  disabled: boolean
  onChange: (value: number) => void
}

function ParameterSlider({
  input,
  value,
  disabled,
  onChange,
}: ParameterSliderProps) {
  const options = input.options
  const optionIndex = options
    ? Math.max(0, options.findIndex((option) => option.value === value))
    : value
  const min = options ? 0 : input.min ?? 0
  const max = options ? Math.max(0, options.length - 1) : input.max ?? 255
  const clampedIndex = Math.min(max, Math.max(min, optionIndex))
  const progress = max === min ? 0 : ((clampedIndex - min) / (max - min)) * 100
  const currentLabel = options?.[clampedIndex]?.label ?? `${value}${input.unit ? ` ${input.unit}` : ''}`
  const showEveryLabel = Boolean(options && options.length <= 5)

  const changeSlider = (nextIndex: number) => {
    onChange(options ? options[nextIndex].value : nextIndex)
  }

  return (
    <div className="rounded-2xl border border-[#e1e9e5] bg-[#f8faf9] px-4 py-4">
      <div className="flex items-baseline justify-between gap-4">
        <strong className="text-sm text-[#263a32]">{input.label}</strong>
        <span className="truncate text-sm font-bold text-[#147a56]">{currentLabel}</span>
      </div>

      <div className="mt-3 px-1">
        <div className="relative h-6">
          <div className="absolute inset-x-[11px] top-1/2 h-1.5 -translate-y-1/2">
            <span className="absolute inset-0 rounded-full bg-[#dbe5e0]" />
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-[#38a57d]"
              style={{ width: `${progress}%` }}
            />
            {options?.map((option, index) => (
              <span
                key={option.value}
                aria-hidden="true"
                className={`absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                  index <= clampedIndex ? 'bg-[#238b66]' : 'bg-[#b8c7c1]'
                }`}
                style={{ left: `${options.length === 1 ? 0 : (index / (options.length - 1)) * 100}%` }}
              />
            ))}
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={1}
            value={clampedIndex}
            disabled={disabled}
            aria-label={input.label}
            aria-valuetext={currentLabel}
            onChange={(event) => changeSlider(Number(event.target.value))}
            className="control-range absolute inset-x-0 top-1/2 z-10 m-0 h-6 w-full -translate-y-1/2 bg-transparent focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-emerald-600/25 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {options && (
          showEveryLabel ? (
            <div
              className="mt-1.5 grid gap-1"
              style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
            >
              {options.map((option, index) => (
                <button
                  type="button"
                  key={option.value}
                  disabled={disabled}
                  onClick={() => onChange(option.value)}
                  className={`min-w-0 truncate rounded-md px-1 py-1 text-[10px] transition-[background-color,color,transform] duration-100 active:scale-[.96] ${
                    index === clampedIndex
                      ? 'bg-[#e0f2eb] font-extrabold text-[#116b4b]'
                      : 'text-[#82918b] hover:text-[#40574e]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-1.5 flex justify-between text-[10px] font-semibold text-[#82918b]">
              <span>{options[0]?.label}</span>
              <span>{options.at(-1)?.label}</span>
            </div>
          )
        )}
        {!options && input.unit && (
          <div className="mt-1.5 flex justify-between text-[10px] font-semibold text-[#82918b]">
            <span>{min} {input.unit}</span>
            <span>{max} {input.unit}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function ParameterSwitcher({
  input,
  value,
  disabled,
  onChange,
}: ParameterSliderProps) {
  const options = input.options ?? []
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))

  return (
    <div className="rounded-2xl border border-[#e1e9e5] bg-[#f8faf9] px-4 py-4">
      <strong className="text-sm text-[#263a32]">{input.label}</strong>
      <div
        role="radiogroup"
        aria-label={input.label}
        className="relative mt-3 grid rounded-xl bg-[#e8eeeb] p-1 shadow-inner"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1 left-1 top-1 rounded-[9px] bg-white shadow-[0_2px_8px_rgb(30_65_52_/_14%)] transition-transform duration-200 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
          style={{
            width: `calc((100% - 8px) / ${options.length})`,
            transform: `translateX(${selectedIndex * 100}%)`,
          }}
        />
        {options.map((option, index) => (
          <button
            type="button"
            role="radio"
            aria-checked={index === selectedIndex}
            key={option.value}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`relative z-10 min-w-0 truncate rounded-[9px] px-2 py-2.5 text-xs font-bold transition-[color,transform] duration-100 active:scale-[.96] disabled:cursor-not-allowed disabled:opacity-50 ${
              index === selectedIndex ? 'text-[#116b4b]' : 'text-[#71817a]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function DeviceControlDialog({
  open,
  targets,
  onClose,
  dataSource = deviceControlDataSource,
  onCompleted,
}: DeviceControlDialogProps) {
  const deviceType = targets[0]?.deviceType
  const sameType = targets.every((target) => target.deviceType === deviceType)
  const specs = useMemo(() => deviceType ? commandsFor(deviceType) : [], [deviceType])
  const [selectedName, setSelectedName] = useState<string>('')
  const [args, setArgs] = useState<number[]>([])
  const [phase, setPhase] = useState<'configure' | 'sending' | 'result'>('configure')
  const [results, setResults] = useState<DeviceCommandResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const selected = specs.find((spec) => spec.commandLine === selectedName) ?? specs[0]

  useEffect(() => {
    if (!open || !specs[0]) return
    setSelectedName(specs[0].commandLine)
    setArgs(initialArgs(specs[0]))
    setPhase('configure')
    setResults([])
    setError(null)
  }, [open, specs])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && phase !== 'sending') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open, phase])

  useEffect(() => {
    const allSucceeded = results.length > 0 && results.every((result) => result.success)
    if (!open || phase !== 'result' || !allSucceeded) return

    const closeTimer = window.setTimeout(onClose, 2_000)
    return () => window.clearTimeout(closeTimer)
  }, [onClose, open, phase, results])

  if (!open) return null

  const chooseCommand = (commandLine: string) => {
    const next = specs.find((spec) => spec.commandLine === commandLine)
    if (!next) return
    setSelectedName(commandLine)
    setArgs(initialArgs(next))
    setResults([])
    setError(null)
    setPhase('configure')
  }

  const send = async () => {
    if (!selected || !deviceType || targets.length === 0 || !sameType) return
    if (!commandArgsAreValid(selected, args)) {
      setError(selected.commandLine === 'ENHANCE_CONTROL_AIR_CONDITION'
        ? '请填写有效参数，且至少修改一个增强控制字段。'
        : '请填写范围内的有效整数参数。')
      return
    }
    if (targets.length > 20) {
      setError('单次批量控制最多支持 20 台设备。')
      return
    }
    setPhase('sending')
    setError(null)
    try {
      const common = { commandLine: selected.commandLine, args, type: deviceType }
      const nextResults = targets.length === 1
        ? [await dataSource.single({ ...common, deviceId: targets[0].id })]
        : await dataSource.multi({ ...common, deviceIds: targets.map((target) => target.id) })
      setResults(nextResults)
      setPhase('result')
      onCompleted?.(nextResults)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '指令发送失败')
      setPhase('configure')
    }
  }

  const successCount = results.filter((result) => result.success).length
  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="设备控制">
      <button
        type="button"
        aria-label="关闭设备控制"
        disabled={phase === 'sending'}
        onClick={onClose}
        className="absolute inset-0 bg-[#0b2019]/35 backdrop-blur-[3px]"
      />
      <section className="absolute left-1/2 top-1/2 max-h-[88vh] w-[min(860px,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[28px] border border-white/75 bg-white/95 shadow-[0_28px_90px_rgb(7_35_26_/_28%)] backdrop-blur-2xl motion-safe:animate-[control-dialog-in_.2s_cubic-bezier(.23,1,.32,1)]">
        <div className={`max-h-[88vh] overflow-y-auto p-7 max-sm:p-5 ${
          sameType && phase !== 'result' ? 'pb-28 max-sm:pb-28' : ''
        }`}>
          <header className="flex items-start justify-between gap-4">
            <div>
              <h2 className="m-0 text-2xl tracking-[-.02em]">
                {targets.length === 1 ? targets[0]?.deviceName : `控制 ${targets.length} 台${deviceType ? typeName[deviceType] : '设备'}`}
              </h2>
            </div>
            <button
              type="button"
              disabled={phase === 'sending'}
              onClick={onClose}
              className="rounded-xl bg-[#eef3f1] px-3 py-2 text-sm font-bold transition-[transform,opacity] duration-150 active:scale-[.97] disabled:opacity-40"
            >
              关闭
            </button>
          </header>

          {!sameType ? (
            <div role="alert" className="mt-6 rounded-2xl bg-red-50 p-5 text-sm font-semibold text-red-700">
              批量控制只支持相同设备类型，请重新选择。
            </div>
          ) : phase === 'result' ? (
            <div className="mt-7">
              <div className={`rounded-2xl p-5 ${successCount === results.length ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                <p className="mb-1 text-sm font-bold text-[#64756e]">执行完成</p>
                <strong className="text-2xl">{successCount}/{results.length} 台成功</strong>
                {results.length > 0 && successCount === results.length && (
                  <p className="mt-2 mb-0 text-xs font-semibold text-emerald-700">
                    控制成功，窗口将在 2 秒后自动关闭
                  </p>
                )}
              </div>
              <ul className="mt-4 grid list-none gap-2 p-0">
                {results.map((result) => (
                  <li key={result.deviceId} className="flex items-center justify-between gap-4 rounded-xl border border-[#e1e9e5] px-4 py-3 text-sm">
                    <span className="truncate font-mono text-xs">{result.deviceId}</span>
                    <span className={`shrink-0 font-bold ${result.success ? 'text-emerald-700' : 'text-red-700'}`}>
                      {result.success ? '成功' : result.message}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setPhase('configure')} className="rounded-xl bg-[#edf3f0] px-4 py-2.5 text-sm font-bold active:scale-[.97]">继续控制</button>
                <button type="button" onClick={onClose} className="rounded-xl bg-[#147a56] px-4 py-2.5 text-sm font-bold text-white active:scale-[.97]">完成</button>
              </div>
            </div>
          ) : (
            <>
            <div className="mt-7 grid grid-cols-[220px_1fr] gap-6 max-md:grid-cols-1">
              <div>
                <p className="mb-2 text-xs font-bold text-[#74837c]">可用指令</p>
                <div className="grid gap-2" role="radiogroup" aria-label="选择控制指令">
                  {specs.map((spec) => (
                    <button
                      key={spec.commandLine}
                      type="button"
                      role="radio"
                      aria-checked={selected?.commandLine === spec.commandLine}
                      disabled={phase === 'sending'}
                      onClick={() => chooseCommand(spec.commandLine)}
                      className={`rounded-xl px-4 py-3 text-left text-sm font-bold transition-[background-color,color,transform] duration-150 active:scale-[.98] ${
                        selected?.commandLine === spec.commandLine
                          ? 'bg-[#dff3eb] text-[#116747]'
                          : 'bg-[#f4f7f5] text-[#5f7169] hover:text-[#243a32]'
                      }`}
                    >
                      {spec.label}
                    </button>
                  ))}
                </div>
              </div>
              {selected && (
                <div>
                  <p className="mb-2 text-xs font-bold text-[#74837c]">指令参数</p>
                  <h3 className="mb-2 text-lg">{selected.label}</h3>
                  <p className="mb-5 text-sm leading-6 text-[#71817a]">{selected.description}</p>
                  {selected.inputs.length === 0 ? (
                    <div className="rounded-2xl bg-[#f2f6f4] p-5 text-sm text-[#65766f]">
                      此指令不需要额外参数。设备地址和自编号由后端自动补齐。
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {selected.inputs.map((input, index) => {
                        const Control = input.name === 'opened' || input.name === 'mode' || input.name === 'speed'
                          ? ParameterSwitcher
                          : ParameterSlider
                        return (
                          <Control
                            key={input.name}
                            input={input}
                            value={args[index] ?? input.options?.[0]?.value ?? input.min ?? 0}
                            disabled={phase === 'sending'}
                            onChange={(nextValue) => setArgs((current) => current.map(
                              (currentValue, argIndex) => argIndex === index ? nextValue : currentValue,
                            ))}
                          />
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
            </>
          )}
        </div>
        {sameType && phase !== 'result' && (
          <footer className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-4 border-t border-white/80 bg-white/90 px-7 py-4 shadow-[0_-12px_30px_rgb(25_59_46_/_8%)] backdrop-blur-xl max-sm:px-5">
            <p className="m-0 text-xs leading-5 text-[#7d8b85]">
              {targets.length > 1 ? '指令会按设备顺序进入网关队列。' : '发送后将等待设备响应，最长约 5 秒。'}
            </p>
            <button
              type="button"
              disabled={phase === 'sending' || !selected || !sameType}
              onClick={() => void send()}
              className={`inline-flex min-w-32 shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-[background-color,transform,opacity] duration-150 active:scale-[.97] disabled:cursor-wait disabled:opacity-65 ${
                selected?.tone === 'caution' ? 'bg-[#b84a38]' : 'bg-[#147a56]'
              }`}
            >
              {phase === 'sending' && <ProgressRing />}
              {phase === 'sending' ? '等待设备响应…' : targets.length > 1 ? `发送至 ${targets.length} 台` : '发送指令'}
            </button>
          </footer>
        )}
      </section>
    </div>
  )
}
