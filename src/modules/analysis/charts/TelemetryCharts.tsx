import { useMemo, useState } from 'react'
import type { TelemetryDashboard } from '../types/telemetry'
import { TelemetryChart } from './TelemetryChart'
import { aggregateUsage, distributionOption, rankingOption, trendOption } from './telemetryChartModel'
import type { DistributionDimension } from './telemetryChartModel'

const dimensions = { laboratory: '实验室', organization: '单位', building: '楼栋' }
export function TelemetryCharts({ dashboard }: { dashboard: TelemetryDashboard }) {
  const [trend, setTrend] = useState<'bar' | 'line'>('bar')
  const [dimension, setDimension] = useState<DistributionDimension>('laboratory')
  const air = dashboard.kind === 'AIR_CONDITION'
  const unit = air ? 'h' : 'kWh'
  const devices = useMemo(() => aggregateUsage(dashboard.rows, 'device'), [dashboard.rows])
  const groups = useMemo(() => aggregateUsage(dashboard.rows, dimension), [dashboard.rows, dimension])
  const timeline = useMemo(() => trendOption(dashboard, trend), [dashboard, trend])
  const ranking = useMemo(() => rankingOption(devices, unit), [devices, unit])
  const distribution = useMemo(() => distributionOption(groups, unit, dimensions[dimension]), [groups, unit, dimension])
  const hasValues = groups.some((group) => group.value > 0)
  const uncertain = dashboard.timeline.some((point) => point.incomplete)
  return <section className="usage-charts" aria-label="统计图表">
    <article className="usage-chart-panel usage-chart-panel--trend">
      <header><div><span className="usage-chart-eyebrow">随时间变化</span><h2>{air ? '运行时长趋势' : '能耗趋势'}</h2><p>{dashboard.periodStart} — {dashboard.periodEnd}{dashboard.timeline.length > 32 ? ' · 可拖动下方滑块缩放时间段' : ''}</p></div>
        <div className="usage-chart-switch" role="group" aria-label="趋势图类型"><button type="button" aria-pressed={trend === 'bar'} onClick={() => setTrend('bar')}>柱状图</button><button type="button" aria-pressed={trend === 'line'} onClick={() => setTrend('line')}>折线图</button></div>
      </header>
      <div className="usage-chart-legend"><span><i />{air ? '运行时长' : '用电量'} · {unit}</span>{uncertain && <span><i className="is-partial" />含缺口或分摊</span>}</div>
      {dashboard.timeline.length > 0 ? <TelemetryChart option={timeline} label={air ? '运行时长趋势图' : '能耗趋势图'} /> : <div className="usage-chart-empty">当前筛选范围暂无趋势数据</div>}
    </article>
    <article className="usage-chart-panel">
      <header><div><span className="usage-chart-eyebrow">使用较多的设备</span><h2>{air ? '内机运行排名' : '空开能耗排名'}</h2><p>Top 8 · 共 {devices.length} 台设备 · {unit}</p></div><span className="usage-chart-type">条形图</span></header>
      {devices.length > 0 ? <TelemetryChart option={ranking} label={air ? '内机运行排名条形图' : '空开能耗排名条形图'} /> : <div className="usage-chart-empty">暂无设备统计</div>}
    </article>
    <article className="usage-chart-panel">
      <header><div><span className="usage-chart-eyebrow">用量如何分布</span><h2>{air ? '运行时长占比' : '能耗占比'}</h2><p>包含全部筛选数据</p></div><label className="usage-chart-dimension"><span className="usage-sr-only">占比分布维度</span><select value={dimension} onChange={(event) => setDimension(event.target.value as DistributionDimension)}>{Object.entries(dimensions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></header>
      {hasValues ? <TelemetryChart option={distribution} label={dimensions[dimension] + (air ? '运行时长占比环图' : '能耗占比环图')} /> : <div className="usage-chart-empty">暂无正用量数据，不生成占比</div>}
    </article>
  </section>
}
