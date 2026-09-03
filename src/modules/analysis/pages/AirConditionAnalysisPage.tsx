export default function AirConditionAnalysisPage() {
  return (
    <div className="bi-page">
      <div className="page-heading bi-page-heading">
        <div><p className="eyebrow">BUSINESS INTELLIGENCE · HVAC</p><h1>空调数据分析</h1></div>
        <p>设备在线率、运行时长与温控效率</p>
      </div>
      <section className="bi-reserved-panel">
        <span className="bi-reserved-panel__icon" aria-hidden="true">⌁</span>
        <div><strong>分析能力已预留</strong><p>待空调运行投影数据接入后，这里将呈现在线设备、开启状态、累计运行时长和能效趋势。</p></div>
        <span className="bi-reserved-panel__badge">即将接入</span>
      </section>
    </div>
  )
}
