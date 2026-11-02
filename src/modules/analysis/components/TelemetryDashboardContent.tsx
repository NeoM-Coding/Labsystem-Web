import { useState } from 'react'
import { TelemetryCharts } from '../charts/TelemetryCharts'
import type { TelemetryDashboard } from '../types/telemetry'

const format = (value: number, digits = 2) => value.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits })
const pageSize = 25

export function TelemetryDashboardContent({ dashboard }: { dashboard: TelemetryDashboard }) {
  const air = dashboard.kind === 'AIR_CONDITION'
  const unit = air ? 'h' : 'kWh'
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<'desc' | 'asc'>('desc')
  const rows = [...dashboard.rows].sort((a, b) => (sort === 'desc' ? b.value - a.value : a.value - b.value) || a.deviceId.localeCompare(b.deviceId))
  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const activePage = Math.min(page, pages)
  const visibleRows = rows.slice((activePage - 1) * pageSize, activePage * pageSize)
  const total = air ? dashboard.metrics.runningHours : dashboard.metrics.energyKwh
  const labs = new Set(rows.map((row) => row.laboratoryId)).size
  return <>
    <section className="usage-summary" aria-label="统计总计">
      <div className="usage-total"><span>{air ? '总运行时长' : '总能耗'}</span><p><strong>{format(total ?? 0)}</strong><span>{unit}</span></p><small>{dashboard.periodStart} — {dashboard.periodEnd}</small></div>
      <div className="usage-summary-meta"><div><span>统计设备</span><strong>{new Set(rows.map((row) => row.deviceId)).size}<small> 台</small></strong></div><div><span>覆盖实验室</span><strong>{labs}<small> 间</small></strong></div><div><span>有效数据覆盖</span><strong>{format((dashboard.metrics.coverage ?? 0) * 100, 1)}<small> %</small></strong></div></div>
    </section>
    <TelemetryCharts dashboard={dashboard} />
    <section className="usage-report" aria-label={air ? '空调运行明细' : '能耗统计明细'}>
      <header className="usage-report-heading"><div><h2>{air ? '运行时长明细' : '能耗明细'}</h2><span>共 {rows.length} 条统计记录</span></div><span className="usage-updated">更新于 {dashboard.calculatedAt.replace('T', ' ')}</span></header>
      {dashboard.qualityNotes.length > 0 && <details className="usage-quality"><summary><span className="usage-quality-dot" />{dashboard.incomplete ? '部分时段数据不完整' : '统计口径说明'}<span>查看说明</span></summary><ul>{dashboard.qualityNotes.map((note) => <li key={note}>{note}</li>)}</ul></details>}
      <div className="usage-table-scroll" tabIndex={0} role="region" aria-label="统计明细，可横向滚动"><table className="usage-table" aria-label={air ? '空调运行统计明细' : '能耗统计明细'}>
        <thead><tr><th className="usage-index">序号</th><th>{air ? '内机名称' : '空开名称'}</th>{air && <th>机组</th>}<th>实验室</th><th>单位</th><th>楼栋</th><th className="usage-number" aria-sort={sort === 'desc' ? 'descending' : 'ascending'}><button type="button" onClick={() => { setSort(sort === 'desc' ? 'asc' : 'desc'); setPage(1) }} aria-label={(air ? '时长' : '能耗') + (sort === 'desc' ? '降序，点击升序' : '升序，点击降序')}>{air ? '时长（h）' : '能耗（kWh）'}<span aria-hidden="true">{sort === 'desc' ? '↓' : '↑'}</span></button></th></tr></thead>
        <tbody>{visibleRows.map((row, index) => <tr key={row.deviceId + ':' + row.laboratoryId}>
          <td className="usage-index">{(activePage - 1) * pageSize + index + 1 < 10 ? '0' : ''}{(activePage - 1) * pageSize + index + 1}</td>
          <th scope="row"><span className="usage-device-name">{row.deviceName}</span>{row.incomplete && <small className="usage-row-quality" title={'有效数据覆盖 ' + format(row.coverage * 100, 1) + '%'}>部分数据</small>}</th>
          {air && <td><span className="usage-group" title={row.groupId ?? undefined}>{row.groupId || '—'}</span></td>}<td>{row.laboratoryName}</td><td>{row.orgName || '—'}</td><td>{row.buildingName || '—'}</td><td className="usage-number">{format(row.value)}</td>
        </tr>)}</tbody>
        {rows.length > 0 && <tfoot><tr><th colSpan={air ? 6 : 5} scope="row">当前筛选合计 <small>包含全部 {rows.length} 条记录</small></th><td className="usage-number">{format(total ?? 0)}<small> {unit}</small></td></tr></tfoot>}
      </table></div>
      {rows.length === 0 && <div className="usage-empty"><span aria-hidden="true">◇</span><h3>暂无统计记录</h3><p>试试调整时间段，或减少筛选条件。</p></div>}
      <footer className="usage-report-footer"><span>所有数据均限定在你的可见实验室范围内</span><nav aria-label="明细分页"><button type="button" aria-label="上一页" disabled={activePage === 1} onClick={() => setPage(activePage - 1)}>←</button><span>{activePage} / {pages}</span><button type="button" aria-label="下一页" disabled={activePage === pages} onClick={() => setPage(activePage + 1)}>→</button></nav></footer>
    </section>

    <p className="usage-footnote">{air ? '时长按有效开机区间累计，单位为小时。' : '能耗按累计电表读数差计算，跨时段按时间比例分摊。'}缺失区间不代表零使用。</p>
  </>
}
