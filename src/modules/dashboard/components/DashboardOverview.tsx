import { useMemo } from 'react'
import { overviewTypes, typeLabels, statusKeys, statusLabel, summarizeDashboard, type DashboardData, type Counts, type OverviewType } from '../dashboardModel'
import './dashboard.css'

interface Props {
  data?: DashboardData
  now: number
  loading?: boolean
  refreshing?: boolean
  error?: string
  updatedAt?: number
  search: string
  onSearchChange: (value: string) => void
  onRefresh: () => void
}

export function DashboardOverview({ data, now, loading, refreshing, error, updatedAt, search, onSearchChange, onRefresh }: Props) {
  const summary = useMemo(() => data ? summarizeDashboard(data, now) : undefined, [data, now])
  const rooms = summary?.rooms.filter(({ laboratory }) => laboratory.laboratoryName.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())) ?? []
  return (
    <div className="overview">
      <header className="overview-heading">
        <div><p className="overview-eyebrow">OVERVIEW</p><h1>概览</h1><p className="overview-muted">当前账户全部可见教室的设备运行情况</p></div>
        <div className="overview-refresh">
          <span role="status">{refreshing ? '正在更新…' : updatedAt ? `更新于 ${new Date(updatedAt).toLocaleTimeString('zh-CN', { hour12: false })}` : '等待加载'}</span>
          <button type="button" disabled={refreshing} onClick={onRefresh}>刷新概览</button>
        </div>
      </header>
      {error && <div className="overview-error" role="alert"><div><strong>{data ? '更新失败，当前显示上次成功数据' : '概览暂时无法加载'}</strong><p>{error}</p></div><button type="button" disabled={refreshing} onClick={onRefresh}>重新加载</button></div>}
      {loading && !data ? <div className="overview-skeleton" role="status" aria-label="正在加载概览"><div /><div /><div /><div /><section /></div> : summary && <>
        <section className="overview-metrics" aria-label="资源汇总">
          {[
            ['可见教室', summary.rooms.length, '当前账户可访问的全部教室'],
            ['设备总数', summary.total.total, '空调、照明、门禁、断路器'],
            ['已开启设备', summary.total.opened, '包含断路器合闸设备'],
            ['离线设备', summary.total.offline, '离线状态不计入开启或关闭'],
          ].map(([label, value, hint], index) => <article className={`overview-metric ${index === 0 ? 'is-primary' : ''}`} key={label}>
            <p>{label}</p><strong>{value}<small>{index === 0 ? '间' : '台'}</small></strong><span>{hint}</span>
          </article>)}
        </section>
        {!summary.rooms.length ? <section className="overview-empty"><h2>暂无可见教室</h2><p>当前账户尚未分配可见教室。</p></section> : <>
          <section aria-labelledby="overview-types-title">
            <div className="overview-section-heading"><h2 id="overview-types-title">设备运行状态</h2><span>每 30 秒自动更新</span></div>
            <div className="overview-categories">{overviewTypes.map((type) => {
              const counts = summary.categories[type]
              return <article className="overview-category" key={type}>
                <div className="overview-category-heading"><h3>{typeLabels[type]}</h3><span>共 {counts.total} 台</span></div>
                <p className="overview-running"><strong>{counts.opened}</strong><span>台{statusLabel('opened', type)}</span></p>
                <div className="overview-bar" aria-hidden="true">{statusKeys.map((status) => <span key={status} className={`overview-tone-${status}`} style={{ width: `${counts.total ? counts[status] / counts.total * 100 : 0}%` }} />)}</div>
                <dl className="overview-status-list">{statusKeys.map((status) => <div key={status}><dt><i className={`overview-tone-${status}`} />{statusLabel(status, type)}</dt><dd>{counts[status]}</dd></div>)}</dl>
                {!counts.total && <p className="overview-no-device">暂无此类设备</p>}
              </article>
            })}</div>
            <p className="overview-note">离线设备不使用历史开关值判断当前运行状态；在线但缺少有效开关数据时显示“状态未知”。</p>
          </section>
          <section className="overview-rooms" aria-labelledby="overview-rooms-title">
            <div className="overview-room-toolbar"><div><h2 id="overview-rooms-title">教室明细</h2><p className="overview-muted">{search.trim() ? `匹配 ${rooms.length} 间 · ` : ''}全部 {summary.rooms.length} 间可见教室</p></div><label className="overview-search"><span>搜索教室</span><input type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="输入教室名称" /></label></div>
            <div className="overview-room-head" aria-hidden="true"><span>教室 / 楼栋</span>{overviewTypes.map((type) => <span key={type}>{typeLabels[type]}</span>)}</div>
            {rooms.map(({ laboratory, categories, total }) => <article className="overview-room" key={laboratory.id}>
              <div className="overview-room-name"><h3>{laboratory.laboratoryName}</h3><p>{laboratory.buildingName}</p>{!total && <span>暂无概览设备</span>}</div>
              {overviewTypes.map((type) => <div className="overview-room-device" key={type} role="group" aria-label={typeLabels[type]}><span className="overview-mobile-label">{typeLabels[type]}</span><RoomCounts counts={categories[type]} type={type} /></div>)}
            </article>)}
            {!rooms.length && <div className="overview-empty"><h3>没有匹配的教室</h3><p>试试其他名称，或清空搜索。</p></div>}
          </section>
        </>}
      </>}
    </div>
  )
}

function RoomCounts({ counts, type }: { counts: Counts; type: OverviewType }) {
  if (!counts.total) return <span className="overview-muted">—</span>
  return <div className="overview-room-counts">{statusKeys.map((status) => <span key={status}><i className={`overview-tone-${status}`} />{statusLabel(status, type)} <b>{counts[status]}</b></span>)}</div>
}
