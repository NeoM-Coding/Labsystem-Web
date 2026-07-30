import { useEffect, useMemo, useRef, useState } from 'react'
import type { Laboratory } from '@/modules/laboratory/types'
import {
  layoutTimetables,
  SECTION_SLOTS,
  timetableSectionLabel,
  WEEKDAYS,
  WEEK_TYPE_LABELS,
} from '../timetableLayout'
import type { PositionedTimetable } from '../timetableLayout'
import type { Timetable } from '../types'

const ROOM_ROW_HEIGHT = 68
const LONG_PRESS_MS = 520
const MOVE_TOLERANCE = 10
const ROW_GROUPS = [1, 3, 5, 7, 9, 11].map((startSection) => ({
  startSection,
  endSection: Math.min(startSection + 1, 11),
}))
const COURSE_COLORS = [
  ['#e3f3ed', '#176c4e', '#9ed0bc'],
  ['#e9eef9', '#395d91', '#b4c7e7'],
  ['#f3eafb', '#704796', '#d4b9e8'],
  ['#fff0df', '#8a5822', '#efd0a8'],
  ['#e5f3f5', '#286d75', '#acd4d8'],
] as const

function colorFor(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index++) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0
  }
  return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length]
}

function CourseBlock({
  positioned,
  segmentKey,
  deleteMode,
  onOpen,
  onEnterDeleteMode,
  onDelete,
}: {
  positioned: PositionedTimetable
  segmentKey: string
  deleteMode: boolean
  onOpen: (timetable: Timetable) => void
  onEnterDeleteMode: () => void
  onDelete: (timetable: Timetable) => void
}) {
  const { timetable, lane, laneCount } = positioned
  const timerRef = useRef<number | null>(null)
  const originRef = useRef({ x: 0, y: 0 })
  const longPressedRef = useRef(false)
  const [pressing, setPressing] = useState(false)
  const [background, foreground, border] = colorFor(`${timetable.courseName}-${timetable.laboratoryId}`)
  const showDetails = laneCount === 1

  const cancelLongPress = () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = null
    setPressing(false)
  }

  useEffect(() => cancelLongPress, [])

  const pointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button')) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    originRef.current = { x: event.clientX, y: event.clientY }
    longPressedRef.current = false
    setPressing(true)
    timerRef.current = window.setTimeout(() => {
      longPressedRef.current = true
      setPressing(false)
      onEnterDeleteMode()
      if ('vibrate' in navigator) navigator.vibrate(18)
    }, LONG_PRESS_MS)
  }

  const pointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pressing) return
    const distance = Math.hypot(
      event.clientX - originRef.current.x,
      event.clientY - originRef.current.y,
    )
    if (distance > MOVE_TOLERANCE) cancelLongPress()
  }

  const pointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const wasLongPress = longPressedRef.current
    const wasPressing = pressing
    cancelLongPress()
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (!wasLongPress && wasPressing) onOpen(timetable)
  }

  return (
    <div
      key={segmentKey}
      role={deleteMode ? undefined : 'button'}
      tabIndex={deleteMode ? -1 : 0}
      aria-label={`${timetable.courseName}，${timetable.laboratoryName ?? '实验室'}，${WEEKDAYS[timetable.weekday - 1]}，${timetableSectionLabel(timetable)}`}
      className={`absolute inset-y-[4px] z-10 select-none overflow-hidden rounded-[11px] border px-2 py-1.5 text-left shadow-[0_4px_12px_rgb(20_54_42_/_7%)] transition-[transform,box-shadow,filter] duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#48a17f]/35 motion-reduce:transition-none ${
        pressing ? 'scale-[.975] brightness-[.98]' : 'hover:-translate-y-px hover:shadow-[0_7px_17px_rgb(20_54_42_/_12%)]'
      } ${deleteMode ? 'pr-7' : ''}`}
      style={{
        left: `calc(${(lane / laneCount) * 100}% + 3px)`,
        width: `calc(${100 / laneCount}% - 6px)`,
        background,
        borderColor: border,
        color: foreground,
        touchAction: 'pan-x pan-y',
      }}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={cancelLongPress}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen(timetable)
        }
      }}
    >
      {deleteMode && (
        <button
          type="button"
          aria-label={`删除 ${timetable.courseName}`}
          onClick={(event) => {
            event.stopPropagation()
            onDelete(timetable)
          }}
          className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-white/92 text-xs font-black text-red-600 shadow-sm transition-transform active:scale-90"
        >
          ×
        </button>
      )}
      <strong className="block truncate text-[12px] leading-5" title={timetable.courseName}>{timetable.courseName}</strong>
      {showDetails && (
        <>
          <span className="block truncate text-[10px] font-semibold opacity-78" title={timetable.teacherName}>{timetable.teacherName}</span>
          <span className="block truncate text-[9px] font-bold opacity-68">
            {timetable.startWeek}–{timetable.endWeek} 周 · {WEEK_TYPE_LABELS[timetable.weekType]}
          </span>
        </>
      )}
    </div>
  )
}

export interface TimetableGridProps {
  timetables: Timetable[]
  laboratories: Laboratory[]
  loading?: boolean
  onOpen: (timetable: Timetable) => void
  onDelete: (timetable: Timetable) => void
}

export function TimetableGrid({
  timetables,
  laboratories,
  loading = false,
  onOpen,
  onDelete,
}: TimetableGridProps) {
  const [deleteMode, setDeleteMode] = useState(false)
  const positioned = useMemo(
    () => laboratories.flatMap((laboratory) =>
      layoutTimetables(timetables.filter((timetable) => timetable.laboratoryId === laboratory.id))),
    [laboratories, timetables],
  )

  useEffect(() => {
    if (!timetables.length) setDeleteMode(false)
  }, [timetables.length])

  return (
    <section aria-label="课程周课表" className="relative overflow-hidden rounded-3xl border border-[#d9e5df] bg-white shadow-[0_14px_42px_rgb(15_49_37_/_6%)]">
      <div className="flex min-h-12 items-center justify-between gap-4 border-b border-[#e3ebe7] bg-white/92 px-5 backdrop-blur-xl">
        <p className="m-0 text-xs font-semibold text-[#71827a]">
          {deleteMode ? '管理模式：点击课程右上角删除，完成后退出' : '单击课程查看与编辑，长按任一课程进入管理模式'}
        </p>
        {laboratories.length > 0 && (deleteMode ? (
          <button type="button" onClick={() => setDeleteMode(false)} className="rounded-lg bg-[#e8f3ee] px-3 py-1.5 text-xs font-bold text-[#176c4e] active:scale-[.97]">
            完成
          </button>
        ) : (
          <button type="button" onClick={() => setDeleteMode(true)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-[#61736b] hover:bg-[#edf3f0] active:scale-[.97]">
            管理
          </button>
        ))}
      </div>
      {laboratories.length === 0 ? (
        <div className="grid min-h-64 place-items-center px-5 text-center">
          <div>
            <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-[#e8f3ee] text-lg text-[#147a56]">＋</span>
            <strong className="mt-3 block text-sm text-[#334a41]">请先选择实验室</strong>
            <p className="mt-1 mb-0 text-xs text-[#829089]">课表不会在空选择时加载全部实验室数据</p>
          </div>
        </div>
      ) : (
        <div className="overflow-auto">
          <div className="min-w-[1320px]">
            <div className="sticky top-0 z-40 grid h-14 grid-cols-[104px_144px_repeat(7,minmax(150px,1fr))]">
              <div className="sticky left-0 z-30 grid place-items-center border-r border-b border-[#dfe8e3] bg-[#f4f8f6] text-xs font-bold text-[#6f8078]">课程时段</div>
              <div className="sticky left-[104px] z-30 grid place-items-center border-r border-b border-[#dfe8e3] bg-[#f4f8f6] text-xs font-bold text-[#6f8078]">实验室</div>
              {WEEKDAYS.map((weekday) => (
                <div key={weekday} className="grid place-items-center border-r border-b border-[#dfe8e3] bg-[#f4f8f6]/96 text-sm font-bold text-[#294139] backdrop-blur-xl last:border-r-0">{weekday}</div>
              ))}
            </div>
            {ROW_GROUPS.map(({ startSection, endSection }) => {
              const first = SECTION_SLOTS[startSection - 1]
              const last = SECTION_SLOTS[endSection - 1]
              return (
                <div
                  key={startSection}
                  className="grid grid-cols-[104px_144px_repeat(7,minmax(150px,1fr))]"
                >
                  <div
                    className="sticky left-0 z-30 grid place-content-center border-r border-b border-[#dfe8e3] bg-[#f8faf9] px-2 text-center"
                    style={{ gridRow: `span ${laboratories.length}`, height: ROOM_ROW_HEIGHT * laboratories.length }}
                  >
                    <strong className="text-xs text-[#3b5047]">{startSection === endSection ? `第 ${startSection} 节` : `${startSection}–${endSection} 节`}</strong>
                    <span className="mt-1 text-[10px] leading-4 text-[#8a9892]">{first.start}<br />{last.end}</span>
                  </div>
                  {laboratories.map((laboratory) => (
                    <div key={`${startSection}-${laboratory.id}`} className="contents">
                      <div
                        className="sticky left-[104px] z-20 flex items-center border-r border-b border-[#dfe8e3] bg-[#fbfcfc] px-3"
                        style={{ height: ROOM_ROW_HEIGHT }}
                      >
                        <span className="block min-w-0 truncate text-[11px] font-bold text-[#52665d]" title={laboratory.laboratoryName}>{laboratory.laboratoryName}</span>
                      </div>
                      {WEEKDAYS.map((weekday, weekdayIndex) => {
                        const items = positioned.filter((item) =>
                          item.timetable.laboratoryId === laboratory.id
                          && item.timetable.weekday === weekdayIndex + 1
                          && item.startSection <= endSection
                          && item.endSection >= startSection)
                        return (
                          <div
                            key={`${laboratory.id}-${weekday}`}
                            className="relative border-r border-b border-[#e5ece8] bg-white last:border-r-0 even:bg-[#fdfefe]"
                            style={{ height: ROOM_ROW_HEIGHT }}
                          >
                            {items.map((item) => (
                              <CourseBlock
                                key={`${item.timetable.id}-${startSection}`}
                                positioned={item}
                                segmentKey={`${item.timetable.id}-${startSection}`}
                                deleteMode={deleteMode}
                                onOpen={onOpen}
                                onEnterDeleteMode={() => setDeleteMode(true)}
                                onDelete={onDelete}
                              />
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}
      {loading && <div className="absolute inset-0 z-50 grid place-items-center bg-white/60 text-sm font-semibold text-[#61736b] backdrop-blur-[2px]">正在更新课表…</div>}
      {!loading && laboratories.length > 0 && timetables.length === 0 && (
        <div className="grid min-h-28 place-items-center border-t border-[#e5ece8] text-sm text-[#829089]">所选实验室在当前学期还没有排课</div>
      )}
    </section>
  )
}
