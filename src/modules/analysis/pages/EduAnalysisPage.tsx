import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { getEduDashboard } from '../api/analysis'
import type {
  EduChartPoint,
  EduDashboard,
  EduMetric,
  EduMetricKind,
  EduTimeRange,
} from '../types'
import { LaboratoryFilterBar } from '@/modules/laboratory/components/LaboratoryFilterBar'
import { useLaboratoryFilterStore } from '@/modules/laboratory/store/laboratoryFilterStore'

const ranges: Array<{ value: EduTimeRange; label: string; hint: string }> = [
  { value: 'TODAY', label: '今日', hint: '按开课时间' },
  { value: 'CURRENT_MONTH', label: '本月', hint: '按日期' },
  { value: 'CURRENT_SEMESTER', label: '本学期', hint: '按教学周' },
]

const metricKinds: Array<{ value: EduMetricKind; label: string; unit: string }> = [
  { value: 'courseCount', label: '课程数', unit: '节' },
  { value: 'teachingHours', label: '学时数', unit: '学时' },
]

const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const calculatedAtFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

function metricValue(metric: EduMetric, kind: EduMetricKind) {
  return metric[kind]
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value))
}

function MetricCard({
  label,
  metric,
  tone,
  detail,
}: {
  label: string
  metric: EduMetric
  tone: 'neutral' | 'success' | 'active' | 'pending'
  detail?: string
}) {
  return (
    <article className="bi-metric-card" data-tone={tone}>
      <div className="bi-metric-card__header">
        <span className="bi-status-dot" aria-hidden="true" />
        <p>{label}</p>
      </div>
      <strong>{metric.courseCount.toLocaleString('zh-CN')}</strong>
      <div className="bi-metric-card__footer">
        <span>{metric.teachingHours.toLocaleString('zh-CN')} 学时</span>
        {detail && <small>{detail}</small>}
      </div>
    </article>
  )
}

function BarChart({
  title,
  description,
  points,
  metricKind,
  emptyMessage,
}: {
  title: string
  description: string
  points: EduChartPoint[]
  metricKind: EduMetricKind
  emptyMessage: string
}) {
  const metricMeta = metricKinds.find((item) => item.value === metricKind) ?? metricKinds[0]
  const max = Math.max(...points.map((point) => metricValue(point.metric, metricKind)), 0)
  const hasValues = max > 0

  return (
    <section className="bi-panel bi-chart-panel">
      <header className="bi-panel__header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="bi-panel__unit">{metricMeta.label}</span>
      </header>
      {hasValues ? (
        <div className="bi-bars" role="list" aria-label={`${title}，统计指标为${metricMeta.label}`}>
          {points.map((point) => {
            const value = metricValue(point.metric, metricKind)
            const width = `${Math.max(value > 0 ? 3 : 0, (value / max) * 100)}%`
            return (
              <div
                className="bi-bar-row"
                key={point.key}
                role="listitem"
                aria-label={`${point.label}：${value.toLocaleString('zh-CN')} ${metricMeta.unit}`}
              >
                <span className="bi-bar-row__label" title={point.label}>{point.label}</span>
                <div className="bi-bar-track" aria-hidden="true">
                  <span className="bi-bar-fill" style={{ width }} />
                </div>
                <strong>{value.toLocaleString('zh-CN')}<small>{metricMeta.unit}</small></strong>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bi-empty-state">
          <span aria-hidden="true">▥</span>
          <p>{emptyMessage}</p>
          <small>调整时间范围或实验室筛选后再试</small>
        </div>
      )}
    </section>
  )
}

function DashboardSkeleton() {
  return (
    <div className="bi-dashboard-skeleton" role="status" aria-label="正在加载教务分析数据">
      <div className="bi-summary-grid">
        {Array.from({ length: 4 }, (_, index) => <span key={index} />)}
      </div>
      <div className="bi-chart-grid"><span /><span /><span /></div>
    </div>
  )
}

export function EduDashboardContent({ dashboard, metricKind }: {
  dashboard: EduDashboard
  metricKind: EduMetricKind
}) {
  const periodLabel = `${dashboard.periodStart} 至 ${dashboard.periodEnd}`
  const activeLaboratoryDetail = `${dashboard.summary.activeLaboratoryCount} 间实验室上课中`

  return (
    <>
      <section className="bi-summary-grid" aria-label="课程状态概览">
        <MetricCard label="范围内课程" metric={dashboard.summary.total} tone="neutral" detail={periodLabel} />
        <MetricCard label="已完成" metric={dashboard.summary.completed} tone="success" />
        <MetricCard label="正在进行" metric={dashboard.summary.active} tone="active" detail={activeLaboratoryDetail} />
        <MetricCard label="待进行" metric={dashboard.summary.pending} tone="pending" />
      </section>

      <div className="bi-chart-grid">
        <BarChart
          title="课程时间分布"
          description={dashboard.range === 'TODAY' ? '按今日开课时间排列' : dashboard.range === 'CURRENT_MONTH' ? '按本月日期排列' : '按学期教学周排列'}
          points={dashboard.timeline}
          metricKind={metricKind}
          emptyMessage="当前时间范围内没有课程"
        />
        <BarChart
          title="星期分布"
          description="观察一周内的课程负荷"
          points={dashboard.weekdays}
          metricKind={metricKind}
          emptyMessage="暂无星期分布数据"
        />
        <BarChart
          title="节次分布"
          description="识别课程集中的授课时段"
          points={dashboard.sections}
          metricKind={metricKind}
          emptyMessage="暂无节次分布数据"
        />
      </div>

      <section className="bi-panel bi-active-panel">
        <header className="bi-panel__header">
          <div>
            <h2>正在进行的课程</h2>
            <p>状态统一计算于 {calculatedAtFormatter.format(new Date(dashboard.calculatedAt))}</p>
          </div>
          <span className="bi-live-badge"><i />实时切片</span>
        </header>
        {dashboard.activeCourses.length ? (
          <div className="bi-active-course-list">
            {dashboard.activeCourses.map((course) => (
              <article className="bi-active-course" key={course.timetableId}>
                <div>
                  <strong>{course.courseName}</strong>
                  <span>{course.teacherName || '未填写教师'}</span>
                </div>
                <p><span>{course.laboratoryName}</span><small>{formatDateTime(course.startAt)} — {formatDateTime(course.endAt)}</small></p>
              </article>
            ))}
          </div>
        ) : (
          <div className="bi-empty-state bi-empty-state--compact">
            <span aria-hidden="true">○</span>
            <p>当前没有正在进行的课程</p>
          </div>
        )}
      </section>
    </>
  )
}

export default function EduAnalysisPage() {
  const [range, setRange] = useState<EduTimeRange>('CURRENT_SEMESTER')
  const [metricKind, setMetricKind] = useState<EduMetricKind>('courseCount')
  const laboratoryIds = useLaboratoryFilterStore((state) => state.laboratoryIds)
  const matchedLaboratories = useLaboratoryFilterStore((state) => state.matchedLaboratories)
  const isResolvingLaboratories = useLaboratoryFilterStore((state) => state.isResolving)
  const stableLaboratoryIds = useMemo(() => [...laboratoryIds].sort(), [laboratoryIds])
  const hasSelectedLaboratories = stableLaboratoryIds.length > 0

  const dashboardQuery = useQuery({
    queryKey: ['bi', 'edu', range, stableLaboratoryIds],
    queryFn: () => getEduDashboard(range, stableLaboratoryIds),
    enabled: !isResolvingLaboratories && hasSelectedLaboratories,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  return (
    <div className="bi-page">
      <div className="page-heading bi-page-heading">
        <div>
          <p className="eyebrow">BUSINESS INTELLIGENCE · EDUCATION</p>
          <h1>教务数据分析</h1>
        </div>
      </div>

      <section className="bi-control-deck" aria-label="教务数据分析筛选">
        <div className="bi-control-row">
          <div className="bi-segmented" aria-label="统计时间范围">
            {ranges.map((item) => (
              <button
                key={item.value}
                type="button"
                className={range === item.value ? 'active' : ''}
                aria-pressed={range === item.value}
                title={item.hint}
                onClick={() => setRange(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="bi-segmented bi-segmented--metric" aria-label="图表统计指标">
            {metricKinds.map((item) => (
              <button
                key={item.value}
                type="button"
                className={metricKind === item.value ? 'active' : ''}
                aria-pressed={metricKind === item.value}
                onClick={() => setMetricKind(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <LaboratoryFilterBar embedded queryScope="bi-edu" selectAllOnResolve />
      </section>

      {dashboardQuery.isError && (
        <div className="bi-error" role="alert">
          <div><strong>教务数据暂时无法加载</strong><p>{dashboardQuery.error.message}</p></div>
          <button type="button" onClick={() => void dashboardQuery.refetch()}>重新加载</button>
        </div>
      )}

      {isResolvingLaboratories || (dashboardQuery.isPending && hasSelectedLaboratories) ? (
        <DashboardSkeleton />
      ) : !hasSelectedLaboratories ? (
        <div className="bi-empty-state bi-empty-state--page">
          <span aria-hidden="true">◇</span>
          <p>{matchedLaboratories.length ? '请选择至少一间实验室' : '当前范围内没有可分析的实验室'}</p>
          <small>教务数据会严格限制在你的可见实验室范围内</small>
        </div>
      ) : dashboardQuery.data ? (
        <div className={dashboardQuery.isFetching ? 'bi-dashboard is-refreshing' : 'bi-dashboard'}>
          <div className="bi-context-line" aria-live="polite">
            <span>{dashboardQuery.data.currentSemester?.name ?? '当前没有生效学期'}</span>
            {dashboardQuery.isFetching && <small>正在更新…</small>}
          </div>
          <EduDashboardContent dashboard={dashboardQuery.data} metricKind={metricKind} />
        </div>
      ) : null}
    </div>
  )
}
