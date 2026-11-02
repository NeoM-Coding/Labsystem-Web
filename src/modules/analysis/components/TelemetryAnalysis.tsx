import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { telemetryDataSource } from '../api/telemetry'
import type { TelemetryDataSource, TelemetryFilters, TelemetryFilterOptions, TelemetryKind } from '../types/telemetry'
import { TelemetryDashboardContent } from './TelemetryDashboardContent'
import { TelemetryFilterPanel } from './TelemetryFilterPanel'
import '../telemetry.css'

const emptyOptions: TelemetryFilterOptions = { buildings: [], organizations: [], laboratories: [], devices: [] }
const same = (a: TelemetryFilters, b: TelemetryFilters) => JSON.stringify(a) === JSON.stringify(b)

export function TelemetryAnalysis({ kind, dataSource = telemetryDataSource, queryScope = 'live', today: fixedToday }: {
  kind: TelemetryKind; dataSource?: TelemetryDataSource; queryScope?: string; today?: string
}) {
  const today = fixedToday ?? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(new Date())
  const initial: TelemetryFilters = { range: 'TODAY', startDate: today, endDate: today, buildingNames: [], orgNames: [], laboratoryIds: [], deviceIds: [] }
  const [draft, setDraft] = useState(initial)
  const [applied, setApplied] = useState(initial)
  const valid = Boolean(draft.startDate && draft.endDate && draft.startDate <= draft.endDate && draft.endDate <= today && draft.endDate <= String(Number(draft.startDate.slice(0, 4)) + 1) + draft.startDate.slice(4))
  const dirty = !same(draft, applied)
  const options = useQuery({
    queryKey: ['bi-options', queryScope, kind, draft.buildingNames, draft.orgNames, draft.laboratoryIds],
    queryFn: () => dataSource.options(kind, draft), staleTime: 60_000,
  })
  const query = useQuery({
    queryKey: ['bi-usage', queryScope, kind, applied],
    queryFn: () => dataSource.dashboard(kind, applied), staleTime: 30_000, retry: false, placeholderData: keepPreviousData,
  })
  const air = kind === 'air-condition'
  const submit = () => { if (!valid) return; if (same(draft, applied)) void query.refetch(); else setApplied(draft) }
  const reset = () => { setDraft(initial); setApplied(initial) }
  return <div className="usage-page">
    <header className="usage-page-heading">
      <div className="usage-heading-copy"><p>数据分析 <span>/</span> {air ? '空调运行' : '能耗统计'}</p><h1>{air ? '空调运行数据统计' : '能耗数据统计'}</h1><span>按时间与实验室范围，汇总每台{air ? '内机的运行时长' : '空开的用电量'}。</span></div>
      <div className="usage-heading-mark" aria-hidden="true">{air ? <svg viewBox="0 0 32 32" fill="none"><rect x="4" y="6" width="24" height="13" rx="4" /><path d="M8 14h16M10 23v3m6-4v6m6-5v3M23 10h1" /></svg> : <svg viewBox="0 0 32 32" fill="none"><path d="m18 3-12 16h9l-1 10 12-16h-9l1-10Z" /></svg>}</div>
    </header>
    <TelemetryFilterPanel kind={kind} filters={draft} options={options.data ?? emptyOptions} loading={options.isFetching} pending={query.isFetching} valid={valid} today={today} dirty={dirty} onChange={setDraft} onQuery={submit} onReset={reset} />
    {options.isError && <div className="usage-error" role="alert"><span>筛选选项加载失败</span><button type="button" onClick={() => void options.refetch()}>重试选项</button></div>}
    {queryScope !== 'live' && <output className="usage-preview-output">预览输出：{JSON.stringify({ draft, applied, loading: query.isFetching })}</output>}
    {query.isError && <div className="usage-error" role="alert"><span>统计暂时无法加载，请重新查询。</span><button type="button" onClick={() => void query.refetch()}>重试</button></div>}
    {query.isPending ? <div className="usage-loading" role="status"><span />正在汇总统计数据…</div> : query.data && <div aria-busy={query.isFetching} className={query.isFetching ? 'usage-results is-updating' : 'usage-results'}><TelemetryDashboardContent key={JSON.stringify(applied) + queryScope} dashboard={query.data} /></div>}
  </div>
}
