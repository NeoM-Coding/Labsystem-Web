import { useEffect, useId, useRef, useState } from 'react'
import type { TelemetryOption } from '../types/telemetry'

export function TelemetryMultiSelect({ label, values, options, loading, onChange }: {
  label: string; values: string[]; options: TelemetryOption[]; loading: boolean
  onChange: (values: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const searchInput = useRef<HTMLInputElement>(null)
  const id = useId()
  useEffect(() => {
    if (!open) return
    searchInput.current?.focus()
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus() } }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [open])
  const visible = options.filter((option) => (option.label + ' ' + (option.description ?? '')).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
  const summary = values.length === 0 ? '全部' : values.length === 1 ? options.find((o) => o.value === values[0])?.label ?? '已选 1 项' : '已选 ' + values.length + ' 项'
  return <div className="usage-select" ref={root}>
    <button type="button" className="usage-select-trigger" aria-label={label + '：' + summary} aria-expanded={open} aria-controls={id} ref={trigger} onClick={() => { setOpen(!open); setSearch('') }}>
      <span className="usage-field-label">{label}</span><span className="usage-select-value">{summary}</span>
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
    </button>
    {open && <div className="usage-select-popover" id={id} role="group" aria-label={'选择' + label}>
      <div className="usage-select-search"><input ref={searchInput} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={'搜索' + label} aria-label={'搜索' + label} /></div>
      <div className="usage-select-actions"><button type="button" aria-pressed={values.length === 0} onClick={() => onChange([])}>全部{label}</button><button type="button" onClick={() => { setOpen(false); trigger.current?.focus() }}>完成</button></div>
      <div className="usage-select-options" aria-busy={loading}>
        {loading ? <p>正在加载选项…</p> : visible.length === 0 ? <p>{search ? '没有找到匹配项' : '当前范围没有可选项'}</p> : visible.map((option) => <label key={option.value} className="usage-select-option">
          <input type="checkbox" checked={values.includes(option.value)} onChange={() => onChange(values.includes(option.value) ? values.filter((v) => v !== option.value) : [...values, option.value])} />
          <span><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
        </label>)}
      </div>
      <small className="usage-select-hint">未指定时包含全部{label}</small>
    </div>}
  </div>
}
