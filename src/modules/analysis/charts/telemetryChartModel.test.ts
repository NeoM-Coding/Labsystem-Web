import { describe, expect, it } from 'vitest'
import { aggregateUsage, distributionSlices, trendOption } from './telemetryChartModel'
import { createTelemetryPreview } from '../pages/telemetryPreviewData'

const filters = { range: 'TODAY' as const, startDate: '2026-11-02', endDate: '2026-11-02', buildingNames: [], orgNames: [], laboratoryIds: [], deviceIds: [] }

describe('chart data integrity', () => {
  it('aggregates current rows by identity and preserves the full filtered total', async () => {
    const dashboard = await createTelemetryPreview('complete').dashboard('air-condition', filters)
    const rows = [...dashboard.rows, { ...dashboard.rows[0], laboratoryId: 'moved-lab', laboratoryName: '其他实验室', value: 2 }]
    const total = rows.reduce((sum, row) => sum + row.value, 0)
    for (const dimension of ['device', 'laboratory', 'organization', 'building'] as const) {
      expect(aggregateUsage(rows, dimension).reduce((sum, group) => sum + group.value, 0)).toBeCloseTo(total)
    }
    const devices = aggregateUsage(rows, 'device')
    expect(devices).toHaveLength(8)
    expect(devices.find((group) => group.key === dashboard.rows[0].deviceId)?.value).toBe(14.75)
    const duplicateNames = rows.map((row) => ({ ...row, deviceName: '同名设备' }))
    expect(aggregateUsage(duplicateNames, 'device')).toHaveLength(8)
  })
  it('combines small pie slices without dropping positive usage or inventing shares for zeros', () => {
    const groups = Array.from({ length: 9 }, (_, index) => ({ key: String(index), name: '组' + index, value: 9 - index, incomplete: index === 8 }))
    const slices = distributionSlices(groups)
    expect(slices).toHaveLength(6)
    expect(slices.reduce((sum, group) => sum + group.value, 0)).toBe(45)
    expect(slices.at(-1)).toMatchObject({ name: '其他（4项）', value: 10, incomplete: true })
    expect(distributionSlices(groups.map((group) => ({ ...group, value: 0 })))).toEqual([])
  })
  it('keeps uncertain zero readings as gaps rather than drawing a known-zero line', async () => {
    const dashboard = await createTelemetryPreview('partial').dashboard('energy', filters)
    const option = trendOption(dashboard, 'line')
    const series = option.series as Array<{ type: string; connectNulls: boolean; data: Array<{ value: number | null }> }>
    expect(series[0].type).toBe('line')
    expect(series[0].connectNulls).toBe(false)
    expect(series[0].data[3].value).toBeNull()
    expect(dashboard.timeline.reduce((sum, point) => sum + point.value, 0)).toBeCloseTo(dashboard.metrics.energyKwh)
  })
})
