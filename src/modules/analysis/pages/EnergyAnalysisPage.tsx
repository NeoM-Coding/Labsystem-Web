export default function EnergyAnalysisPage() {
  return (
    <div className="bi-page">
      <div className="page-heading bi-page-heading">
        <div><p className="eyebrow">BUSINESS INTELLIGENCE · ENERGY</p><h1>用电数据分析</h1></div>
        <p>断路器负载、用电趋势与异常峰值</p>
      </div>
      <section className="bi-reserved-panel">
        <span className="bi-reserved-panel__icon" aria-hidden="true">ϟ</span>
        <div><strong>分析能力已预留</strong><p>待用电遥测投影数据接入后，这里将呈现实时负载、分时用电、峰谷趋势和异常告警。</p></div>
        <span className="bi-reserved-panel__badge">即将接入</span>
      </section>
    </div>
  )
}
