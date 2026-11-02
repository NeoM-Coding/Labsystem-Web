import { useMemo, useState } from 'react'
import { TelemetryAnalysis } from '../components/TelemetryAnalysis'
import type { TelemetryKind } from '../types/telemetry'
import { createTelemetryPreview } from './telemetryPreviewData'

export default function TelemetryAnalysisPreviewPage() {
  const [kind, setKind] = useState<TelemetryKind>('air-condition')
  const [state, setState] = useState('complete')
  const source = useMemo(() => createTelemetryPreview(state), [state])
  return <><section className="usage-preview-controls"><label>分析类型 <select value={kind} onChange={(e) => setKind(e.target.value as TelemetryKind)}><option value="air-condition">空调</option><option value="energy">用电</option></select></label><label>输出状态 <select value={state} onChange={(e) => setState(e.target.value)}><option value="complete">完整</option><option value="partial">数据缺口</option><option value="empty">空数据</option><option value="loading">加载中</option><option value="error">加载失败</option></select></label></section><TelemetryAnalysis key={kind + state} kind={kind} dataSource={source} queryScope={'preview-' + state} today="2026-11-02" /></>
}
