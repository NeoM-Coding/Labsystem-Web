import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { TelemetryCharts } from './TelemetryCharts'
import { createTelemetryPreview } from '../pages/telemetryPreviewData'

const captured = vi.hoisted(() => new Map<string, unknown>())
vi.mock('./TelemetryChart', () => ({
  TelemetryChart: ({ label, option }: { label: string; option: unknown }) => { captured.set(label, option); return <div role="img" aria-label={label} /> },
}))
afterEach(() => { cleanup(); captured.clear() })

it('switches chart type and distribution dimension using the same filtered rows', async () => {
  const dashboard = await createTelemetryPreview('complete').dashboard('energy', { range: 'TODAY', startDate: '2026-11-02', endDate: '2026-11-02', buildingNames: [], orgNames: [], laboratoryIds: [], deviceIds: [] })
  render(<TelemetryCharts dashboard={dashboard} />)
  expect(screen.getAllByRole('img')).toHaveLength(3)
  fireEvent.click(screen.getByRole('button', { name: '折线图' }))
  const trend = captured.get('能耗趋势图') as { series: Array<{ type: string }> }
  expect(trend.series[0].type).toBe('line')
  expect(screen.getByRole('button', { name: '折线图' })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.change(screen.getByLabelText('占比分布维度'), { target: { value: 'building' } })
  const distribution = captured.get('楼栋能耗占比环图') as { series: Array<{ data: Array<{ value: number }> }> }
  expect(distribution.series[0].data).toHaveLength(2)
  expect(distribution.series[0].data.reduce((sum, item) => sum + item.value, 0)).toBeCloseTo(dashboard.metrics.energyKwh)
})
it('does not display charts or fabricated pie proportions when the result is empty', async () => {
  const dashboard = await createTelemetryPreview('empty').dashboard('air-condition', { range: 'TODAY', startDate: '2026-11-02', endDate: '2026-11-02', buildingNames: [], orgNames: [], laboratoryIds: [], deviceIds: [] })
  render(<TelemetryCharts dashboard={dashboard} />)
  expect(screen.queryAllByRole('img')).toHaveLength(0)
  expect(screen.getByText('暂无正用量数据，不生成占比')).toBeInTheDocument()
})
