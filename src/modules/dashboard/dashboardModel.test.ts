import { describe, expect, it } from 'vitest'
import { summarizeDashboard, statusKeys } from './dashboardModel'
import { dashboardPreviewData as data, previewNow } from './pages/dashboardPreviewData'

describe('overview aggregation', () => {
  it('excludes sensors everywhere while retaining sensor-only and empty classrooms', () => {
    const result = summarizeDashboard(data, previewNow)
    expect(result.total).toEqual({ total: 8, opened: 3, closed: 3, offline: 1, unknown: 1 })
    expect(result.rooms).toHaveLength(4)
    expect(result.rooms.find((room) => room.laboratory.id === 'lab-3')?.total).toBe(0)
    expect(result.rooms.find((room) => room.laboratory.id === 'lab-4')?.total).toBe(0)
    expect(result.categories.CircuitBreak.opened).toBe(1)
    Object.values(result.categories).forEach((counts) => {
      expect(statusKeys.reduce((sum, key) => sum + counts[key], 0)).toBe(counts.total)
    })
  })
  it('does not count historical opened values as current state when offline or stale', () => {
    expect(summarizeDashboard(data, previewNow + 60_001).total).toEqual({ total: 8, opened: 0, closed: 0, offline: 8, unknown: 0 })
    const missing = summarizeDashboard({ ...data, snapshots: [] }, previewNow)
    expect(missing.total.offline).toBe(8)
  })
  it('accepts only boolean switch values and ignores devices outside visible classrooms', () => {
    const modified = { ...data, snapshots: data.snapshots.map((snapshot) => ({ ...snapshot, record: { opened: 'true' } })) }
    expect(summarizeDashboard(modified, previewNow).total.unknown).toBe(7)
    expect(summarizeDashboard({ ...data, laboratories: [] }, previewNow).total.total).toBe(0)
  })
})
