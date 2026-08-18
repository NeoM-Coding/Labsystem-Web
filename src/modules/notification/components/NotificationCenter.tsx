import { useEffect, useRef, useState } from 'react'
import { useNotificationStore } from '../store/notificationStore'
import type { RuleActionResult } from '../types'

function instant(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null
  const numeric = typeof value === 'number' && Math.abs(value) < 1e12 ? value * 1_000 : value
  const date = new Date(numeric)
  return Number.isFinite(date.valueOf()) ? date : null
}

function statusLabel(action: RuleActionResult) {
  if (action.status === 'SUCCESS') return action.type === 'Control' ? '控制成功' : '通知完成'
  if (action.status === 'FAILED') return '执行失败'
  return action.type === 'Report' ? '外部通道未接入' : '尚未实现'
}

function statusClass(status: RuleActionResult['status']) {
  if (status === 'SUCCESS') return 'bg-emerald-50 text-emerald-700'
  if (status === 'FAILED') return 'bg-red-50 text-red-700'
  return 'bg-amber-50 text-amber-800'
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const messages = useNotificationStore((state) => state.messages)
  const markRead = useNotificationStore((state) => state.markRead)
  const markAllRead = useNotificationStore((state) => state.markAllRead)
  const clear = useNotificationStore((state) => state.clear)
  const unread = messages.filter((message) => !message.read).length

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('pointerdown', closeOutside)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('pointerdown', closeOutside)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={`站内信${unread ? `，${unread} 条未读` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative grid size-10 place-items-center rounded-xl text-[#607168] transition-[background-color,color,transform] duration-150 hover:bg-[#edf5f1] hover:text-[#176d4f] active:scale-[.96]"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-[1.8]"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></svg>
        {unread > 0 && <span className="absolute right-1 top-1 min-w-4 rounded-full bg-[#d14343] px-1 text-[9px] font-extrabold leading-4 text-white">{unread > 99 ? '99+' : unread}</span>}
      </button>

      {open && (
        <section className="absolute right-0 top-[calc(100%+10px)] z-50 flex max-h-[min(620px,calc(100vh-90px))] w-[min(420px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-[#dce6e1] bg-white/96 shadow-[0_24px_70px_rgb(11_45_34_/_22%)] backdrop-blur-2xl" aria-label="站内信列表">
          <header className="flex items-center justify-between gap-3 border-b border-[#e4ebe7] px-4 py-3.5">
            <div><strong className="block text-sm text-[#263c33]">站内信</strong><small className="text-[10px] text-[#84928c]">规则动作组执行结果</small></div>
            <div className="flex gap-1">
              <button type="button" disabled={unread === 0} onClick={markAllRead} className="rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-[#176d4f] hover:bg-[#edf5f1] disabled:opacity-35">全部已读</button>
              <button type="button" disabled={messages.length === 0} onClick={clear} className="rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-[#7a8982] hover:bg-[#f1f4f2] disabled:opacity-35">清空</button>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
            {messages.length === 0 ? (
              <div className="grid min-h-48 place-items-center px-5 text-center"><div><span className="mx-auto grid size-11 place-items-center rounded-full bg-[#edf5f1] text-xl">✓</span><strong className="mt-3 block text-sm text-[#4f6259]">暂无站内信</strong><p className="mt-1 mb-0 text-xs text-[#8a9791]">规则命中并执行动作后会显示在这里。</p></div></div>
            ) : messages.map(({ event, read }) => {
              const data = event.data
              const reportContents = data.actions.filter((action) => action.type === 'Report' && action.content?.trim()).map((action) => action.content!.trim())
              const occurredAt = instant(event.occurredAt)
              return (
                <article key={event.eventId} className={`mb-2 rounded-xl border p-3 transition-colors ${read ? 'border-[#e4ebe7] bg-white' : 'border-[#bfe0d2] bg-[#f0faf5]'}`}>
                  <button type="button" onClick={() => markRead(event.eventId)} className="block w-full text-left">
                    <span className="flex items-start justify-between gap-3"><strong className="min-w-0 truncate text-sm text-[#243c32]">{reportContents[0] || '策略动作组已执行'}</strong>{!read && <span className="mt-1 size-2 shrink-0 rounded-full bg-[#22ae7a]" />}</span>
                    <span className="mt-1 block truncate text-[11px] text-[#71827a]">{data.runtimeId} · {data.actionGroupId}</span>
                    <span className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-[#7d8d85]"><span className="truncate">设备条件：{data.deviceConditionGroupId}</span><span className="truncate">时间条件：{data.timeConditionGroupId}</span></span>
                    {reportContents.slice(1).map((content) => <span key={content} className="mt-1 block line-clamp-2 text-xs leading-5 text-[#50645b]">{content}</span>)}
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      {data.actions.map((action) => <span key={`${action.index}-${action.type}`} className={`rounded-full px-2 py-1 text-[9px] font-bold ${statusClass(action.status)}`}>{statusLabel(action)}</span>)}
                    </span>
                    <span className="mt-2 block text-[9px] text-[#98a49e]">{occurredAt?.toLocaleString('zh-CN') ?? '时间未知'}</span>
                  </button>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
