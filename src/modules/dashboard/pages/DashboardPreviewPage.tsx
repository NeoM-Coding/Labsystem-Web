import { useState } from 'react'
import { DashboardOverview } from '../components/DashboardOverview'
import { dashboardPreviewData, previewNow } from './dashboardPreviewData'

const scenarios = { normal: '正常与未知状态', empty: '零可见教室', noDevices: '仅有传感器 / 无设备', loading: '首次加载', error: '首次加载失败', stale: '刷新失败保留数据', refreshing: '更新中' }
export default function DashboardPreviewPage() {
  const [scenario, setScenario] = useState<keyof typeof scenarios>('normal')
  const [search, setSearch] = useState('')
  const [refreshCount, setRefreshCount] = useState(0)
  const data = scenario === 'loading' || scenario === 'error' ? undefined
    : scenario === 'empty' ? { laboratories: [], devices: [], snapshots: [] }
    : scenario === 'noDevices' ? { ...dashboardPreviewData, devices: dashboardPreviewData.devices.filter((device) => device.deviceType === 'Sensor') }
    : dashboardPreviewData
  return <>
    <div className="overview-preview">
      <label>预览场景<select value={scenario} onChange={(event) => setScenario(event.target.value as keyof typeof scenarios)}>{Object.entries(scenarios).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <output>搜索值：{search || '（空）'} · 刷新事件：{refreshCount} 次</output>
      <span>本地固定数据 · 不连接后端</span>
    </div>
    <DashboardOverview data={data} now={previewNow} loading={scenario === 'loading'} refreshing={scenario === 'refreshing'}
      error={scenario === 'error' || scenario === 'stale' ? '预览：网络暂时不可用，请稍后重试。' : undefined}
      updatedAt={data ? previewNow : undefined} search={search} onSearchChange={setSearch} onRefresh={() => setRefreshCount((count) => count + 1)} />
  </>
}
