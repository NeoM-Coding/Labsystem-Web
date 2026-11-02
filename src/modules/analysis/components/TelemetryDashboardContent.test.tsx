import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { TelemetryDashboardContent } from './TelemetryDashboardContent'
import { createTelemetryPreview } from '../pages/telemetryPreviewData'

vi.mock('../charts/TelemetryChart', () => ({
  TelemetryChart: ({ label }: { label: string }) => <div role="img" aria-label={label} />,
}))

afterEach(cleanup)
it('paginates and sorts device rows while preserving the full filtered total', async () => {
  const dashboard = await createTelemetryPreview('complete').dashboard('air-condition', { range: 'TODAY', startDate: '2026-11-02', endDate: '2026-11-02', buildingNames: [], orgNames: [], laboratoryIds: [], deviceIds: [] })
  dashboard.rows = Array.from({ length: 35 }, (_, i) => ({ ...dashboard.rows[0], deviceId: String(i + 1), deviceName: '内机 ' + (i + 1), value: i + 1 }))
  dashboard.metrics.runningHours = 630
  render(<TelemetryDashboardContent dashboard={dashboard} />)
  const table = screen.getByRole('table', { name: '空调运行统计明细' })
  expect(within(table).getAllByRole('row')).toHaveLength(27)
  expect(screen.getAllByText('630.00')).toHaveLength(2)
  fireEvent.click(screen.getByRole('button', { name: '下一页' }))
  expect(within(table).getAllByRole('row')).toHaveLength(12)
  expect(screen.getByRole('cell', { name: '26' })).toBeInTheDocument()
  expect(screen.getAllByText('630.00')).toHaveLength(2)
  fireEvent.click(screen.getByRole('button', { name: '时长降序，点击升序' }))
  expect(screen.getByRole('button', { name: '上一页' })).toBeDisabled()
  expect(within(table).getAllByRole('row')[1]).toHaveTextContent('内机 1')
})
