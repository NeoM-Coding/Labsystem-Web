import type { TelemetryFilters, TelemetryFilterOptions, TelemetryKind } from '../types/telemetry'
import { TelemetryMultiSelect } from './TelemetryMultiSelect'

export function TelemetryFilterPanel({ kind, filters, options, loading, pending, valid, today, dirty, onChange, onQuery, onReset }: {
  kind: TelemetryKind; filters: TelemetryFilters; options: TelemetryFilterOptions; loading: boolean
  pending: boolean; valid: boolean; today: string; dirty: boolean
  onChange: (filters: TelemetryFilters) => void; onQuery: () => void; onReset: () => void
}) {
  const dates = (range: TelemetryFilters['range']) => {
    onChange({ ...filters, range, startDate: range === 'CURRENT_MONTH' ? today.slice(0, 7) + '-01' : today, endDate: today })
  }
  return <section className="usage-filter-panel" aria-label="统计条件">
    <div className="usage-filter-top">
      <div><span className="usage-field-label">统计时间</span><div className="usage-presets" aria-label="时间快捷选择">{([{ value: 'TODAY', label: '今日' }, { value: 'CURRENT_MONTH', label: '本月' }, { value: 'CUSTOM', label: '自定义' }] as const).map((item) =>
        <button type="button" key={item.value} aria-pressed={filters.range === item.value} onClick={() => item.value === 'CUSTOM' ? onChange({ ...filters, range: 'CUSTOM' }) : dates(item.value)}>{item.label}</button>)}</div></div>
      <div className="usage-dates"><label><span className="usage-field-label">开始日期</span><input type="date" value={filters.startDate} max={filters.endDate || today} onChange={(event) => onChange({ ...filters, range: 'CUSTOM', startDate: event.target.value })} /></label><span aria-hidden="true">—</span><label><span className="usage-field-label">结束日期</span><input type="date" value={filters.endDate} min={filters.startDate} max={today} onChange={(event) => onChange({ ...filters, range: 'CUSTOM', endDate: event.target.value })} /></label></div>
      <span className="usage-filter-timezone">按北京时间统计</span>
    </div>
    <div className="usage-dimensions">
      <TelemetryMultiSelect label="楼栋" values={filters.buildingNames} options={options.buildings} loading={loading} onChange={(buildingNames) => onChange({ ...filters, buildingNames, laboratoryIds: [], deviceIds: [] })} />
      <TelemetryMultiSelect label="单位" values={filters.orgNames} options={options.organizations} loading={loading} onChange={(orgNames) => onChange({ ...filters, orgNames, laboratoryIds: [], deviceIds: [] })} />
      <TelemetryMultiSelect label="实验室" values={filters.laboratoryIds} options={options.laboratories} loading={loading} onChange={(laboratoryIds) => onChange({ ...filters, laboratoryIds, deviceIds: [] })} />
      <TelemetryMultiSelect label={kind === 'air-condition' ? '内机名称' : '空开名称'} values={filters.deviceIds} options={options.devices} loading={loading} onChange={(deviceIds) => onChange({ ...filters, deviceIds })} />
    </div>
    <div className="usage-filter-footer">
      <span aria-live="polite">{!valid ? '请选择一年以内、不含未来日期的有效时间段' : dirty ? '筛选条件已更改，查询后更新结果' : '未指定的筛选项包含全部可见数据'}</span>
      <div><button type="button" className="usage-reset" onClick={onReset}>重置</button><button type="button" className="usage-query" disabled={!valid} onClick={onQuery}>{pending ? '查询中…' : '查询统计'}<span aria-hidden="true">↗</span></button></div>
    </div>
  </section>
}
