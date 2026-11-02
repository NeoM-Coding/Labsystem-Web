import { useEffect, useRef, useState } from 'react'
import type { EChartsType } from 'echarts/core'
import type { EChartsOption } from 'echarts'

/** Owns exactly one instance; options, container size and motion preference can change independently. */
export function TelemetryChart({ option, label }: { option: EChartsOption; label: string }) {
  const container = useRef<HTMLDivElement>(null)
  const chart = useRef<EChartsType | null>(null)
  const latest = useRef(option)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    latest.current = option
    if (chart.current) {
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
      chart.current.setOption({ ...option, animation: !reduced }, { notMerge: true })
    }
  }, [option])

  useEffect(() => {
    let active = true
    let frame = 0
    let observer: ResizeObserver | undefined
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const render = () => chart.current?.setOption({ ...latest.current, animation: !motion?.matches }, { notMerge: true })
    const resize = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => { if (active) chart.current?.resize() })
    }
    motion?.addEventListener('change', render)
    window.addEventListener('resize', resize)
    void import('./echartsRuntime').then(({ init }) => {
      if (!active || !container.current) return
      chart.current = init(container.current, undefined, { renderer: 'svg' })
      render()
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(resize)
        observer.observe(container.current)
      }
    }).catch(() => { if (active) setFailed(true) })
    return () => {
      active = false
      observer?.disconnect()
      motion?.removeEventListener('change', render)
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(frame)
      chart.current?.dispose()
      chart.current = null
    }
  }, [])

  return failed
    ? <div className="usage-chart-fallback" role="status">图表暂时无法加载，可在下方明细表查看全部数值。</div>
    : <div ref={container} className="usage-echart" role="img" aria-label={label} />
}
