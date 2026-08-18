import type { ReactNode } from 'react'

export function LinkButton({ children, onClick, title }: {
  children: ReactNode
  onClick: () => void
  title?: string
}) {
  return (
    <button type="button" onClick={onClick} title={title} className="max-w-full break-all text-left font-semibold text-[#147a56] underline decoration-[#9fcdbb] underline-offset-4 hover:text-[#0d6042]">
      {children}
    </button>
  )
}

export function DetailDialog({ title, eyebrow, children, onClose }: {
  title: string
  eyebrow: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[95] grid place-items-center p-5" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label={`关闭${title}`} onClick={onClose} className="absolute inset-0 bg-[#092018]/35 backdrop-blur-[3px]" />
      <section className="relative max-h-[min(760px,88vh)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/70 bg-white shadow-[0_24px_80px_rgb(8_39_29_/_25%)]">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#e5ece8] bg-white/95 px-6 py-5 backdrop-blur-xl">
          <div className="min-w-0"><p className="m-0 text-xs font-extrabold tracking-[.12em] text-[#18825c]">{eyebrow}</p><h2 className="mt-1 mb-0 break-all text-xl">{title}</h2></div>
          <button type="button" onClick={onClose} className="rounded-xl bg-[#edf3f0] px-3 py-2 text-sm font-bold active:scale-[.97]">关闭</button>
        </header>
        <div className="p-6">{children}</div>
      </section>
    </div>
  )
}

export function DetailList({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="m-0 grid overflow-hidden rounded-2xl border border-[#e3ebe7]">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[130px_minmax(0,1fr)] gap-4 border-b border-[#e8eeeb] px-4 py-3 last:border-b-0 max-sm:grid-cols-1 max-sm:gap-1">
          <dt className="text-xs font-bold text-[#7b8983]">{label}</dt>
          <dd className="m-0 min-w-0 break-words text-sm text-[#20342c]">{value || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const failure = status === 'FAILED' || status === 'PARTIAL_FAILED'
  const success = status === 'SUCCESS'
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide ${failure ? 'bg-red-50 text-red-700' : success ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{status || 'UNKNOWN'}</span>
}

export function LogPagination({ current, pages, total, loading, onChange }: {
  current: number
  pages: number
  total: number
  loading: boolean
  onChange: (page: number) => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5ece8] px-5 py-4">
      <span className="text-xs text-[#74847d]">共 {total} 条 · 第 {current} / {Math.max(pages, 1)} 页</span>
      <div className="flex gap-2">
        <button type="button" disabled={loading || current <= 1} onClick={() => onChange(current - 1)} className="rounded-lg bg-[#edf3f0] px-3 py-2 text-xs font-bold disabled:opacity-40">上一页</button>
        <button type="button" disabled={loading || current >= pages} onClick={() => onChange(current + 1)} className="rounded-lg bg-[#147a56] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">下一页</button>
      </div>
    </div>
  )
}
