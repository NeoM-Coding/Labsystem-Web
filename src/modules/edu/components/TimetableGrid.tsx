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

const SECTION_ROW_HEIGHT = 56
const LONG_PRESS_MS = 520
const MOVE_TOLERANCE = 10
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
  gridColumn,
  deleteMode,
  onOpen,
  onEnterDeleteMode,
  onDelete,
}: {
  positioned: PositionedTimetable
  gridColumn: number
  deleteMode: boolean
  onOpen: (timetable: Timetable) => void
  onEnterDeleteMode: () => void
  onDelete: (timetable: Timetable) => void
}) {
  const { timetable, startSection, endSection, lane, laneCount } = positioned
  const timerRef = useRef<number | null>(null)
  const originRef = useRef({ x: 0, y: 0 })
  const longPressedRef = useRef(false)
  const [pressing, setPressing] = useState(false)
  const [background, foreground, border] = colorFor(`${timetable.courseName}-${timetable.laboratoryId}`)
  const sectionSpan = endSection - startSection + 1
  const showDetails = sectionSpan >= 2 && laneCount === 1

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
      role={deleteMode ? undefined : 'button'}
      tabIndex={deleteMode ? -1 : 0}
      aria-label={`${timetable.courseName}，${timetable.laboratoryName ?? '实验室'}，${WEEKDAYS[timetable.weekday - 1]}，${timetableSectionLabel(timetable)}`}
      className={`relative z-10 my-1 self-stretch select-none overflow-hidden rounded-[11px] border px-2 py-1.5 text-left shadow-[0_4px_12px_rgb(20_54_42_/_7%)] transition-[transform,box-shadow,filter] duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#48a17f]/35 motion-reduce:transition-none ${
        pressing ? 'scale-[.975] brightness-[.98]' : 'hover:-translate-y-px hover:shadow-[0_7px_17px_rgb(20_54_42_/_12%)]'
      } ${deleteMode ? 'pr-7' : ''}`}
      style={{
        gridColumn,
        gridRow: `${startSection} / span ${sectionSpan}`,
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
  const laboratoryIndexById = useMemo(
    () => new Map(laboratories.map((laboratory, index) => [laboratory.id, index])),
    [laboratories],
  )
  const laboratoryCount = laboratories.length
  const subColumnMinWidth = laboratoryCount > 1 ? 112 : 150
  const gridTemplateColumns = `104px repeat(${WEEKDAYS.length * laboratoryCount}, minmax(${subColumnMinWidth}px, 1fr))`
  const timetableMinWidth = Math.max(
    1180,
    104 + WEEKDAYS.length * laboratoryCount * subColumnMinWidth,
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
          <div style={{ minWidth: timetableMinWidth }}>
            <div
              className="sticky top-0 z-40 grid grid-rows-[34px_32px]"
              style={{ gridTemplateColumns }}
            >
              <div
                className="sticky left-0 z-40 grid place-items-center border-r border-b border-[#dfe8e3] bg-[#f4f8f6] text-xs font-bold text-[#6f8078]"
                style={{ gridColumn: 1, gridRow: '1 / span 2' }}
              >
                课程时段
              </div>
              {WEEKDAYS.map((weekday, weekdayIndex) => {
                const weekdayStartColumn = 2 + weekdayIndex * laboratoryCount
                return (
                  <div key={weekday} className="contents">
                    <div
                      className="grid place-items-center border-r border-b border-[#dfe8e3] bg-[#f4f8f6]/96 text-sm font-bold text-[#294139] backdrop-blur-xl"
                      style={{
                        gridColumn: `${weekdayStartColumn} / span ${laboratoryCount}`,
                        gridRow: 1,
                      }}
                    >
                      {weekday}
                    </div>
                    {laboratories.map((laboratory, laboratoryIndex) => (
                      <div
                        key={`${weekday}-${laboratory.id}`}
                        className="grid min-w-0 place-items-center border-r border-b border-[#dfe8e3] bg-[#f8faf9]/96 px-2 text-[10px] font-bold text-[#6e8178] backdrop-blur-xl"
                        style={{
                          gridColumn: weekdayStartColumn + laboratoryIndex,
                          gridRow: 2,
                        }}
                        title={laboratory.laboratoryName}
                      >
                        <span className="block min-w-0 max-w-full truncate">
                          {laboratory.laboratoryName}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
            <div
              className="grid"
              style={{
                gridTemplateColumns,
                gridTemplateRows: `repeat(${SECTION_SLOTS.length}, ${SECTION_ROW_HEIGHT}px)`,
              }}
            >
              {SECTION_SLOTS.map((slot) => (
                <div key={`section-${slot.section}`} className="contents">
                  <div
                    className="sticky left-0 z-30 grid place-content-center border-r border-b border-[#dfe8e3] bg-[#f8faf9] px-2 text-center"
                    style={{ gridColumn: 1, gridRow: slot.section }}
                  >
                    <strong className="text-xs text-[#3b5047]">第 {slot.section} 节</strong>
                    <span className="mt-0.5 text-[9px] leading-3.5 text-[#8a9892]">
                      {slot.start}–{slot.end}
                    </span>
                  </div>
                  {WEEKDAYS.map((weekday, weekdayIndex) =>
                    laboratories.map((laboratory, laboratoryIndex) => (
                      <div
                        key={`${slot.section}-${weekday}-${laboratory.id}`}
                        aria-hidden="true"
                        className={`border-r border-b border-[#e5ece8] ${
                          laboratoryIndex % 2 === 0 ? 'bg-white' : 'bg-[#fbfdfc]'
                        }`}
                        style={{
                          gridColumn: 2 + weekdayIndex * laboratoryCount + laboratoryIndex,
                          gridRow: slot.section,
                        }}
                      />
                    )),
                  )}
                </div>
              ))}
              {positioned.map((item) => {
                const laboratoryIndex = laboratoryIndexById.get(item.timetable.laboratoryId)
                if (laboratoryIndex === undefined) return null
                return (
                  <CourseBlock
                    key={item.timetable.id}
                    positioned={item}
                    gridColumn={
                      2
                      + (item.timetable.weekday - 1) * laboratoryCount
                      + laboratoryIndex
                    }
                    deleteMode={deleteMode}
                    onOpen={onOpen}
                    onEnterDeleteMode={() => setDeleteMode(true)}
                    onDelete={onDelete}
                  />
                )
              })}
            </div>
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
