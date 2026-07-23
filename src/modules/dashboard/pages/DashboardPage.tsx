const metrics = [
  { label: '实验室总数', value: '--', hint: '等待数据接入' },
  { label: '设备总数', value: '--', hint: '等待数据接入' },
  { label: '今日预约', value: '--', hint: '等待数据接入' },
  { label: '待处理事项', value: '--', hint: '等待数据接入' },
]

export default function DashboardPage() {
  return (
    <div>
      <div className="page-heading">
        <div><p className="eyebrow">OVERVIEW</p><h1>工作台</h1></div>
        <p className="muted">实验室资源与运行情况概览</p>
      </div>
      <section className="metric-grid">
        {metrics.map((item) => (
          <article className="metric-card" key={item.label}>
            <p>{item.label}</p><strong>{item.value}</strong><small>{item.hint}</small>
          </article>
        ))}
      </section>
      <section className="content-card">
        <h2>模块接入区</h2>
        <p className="muted">后续可按业务域增加实验室、设备、预约、耗材和权限管理模块。</p>
      </section>
    </div>
  )
}
