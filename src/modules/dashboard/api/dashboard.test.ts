import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDashboard } from './dashboard'
import { getLaboratories } from '@/modules/laboratory/api/laboratories'
import { getDevices, getTelemetrySnapshots } from '@/modules/device/api/devices'
import { dashboardPreviewData as data } from '../pages/dashboardPreviewData'

vi.mock('@/modules/laboratory/api/laboratories', () => ({ getLaboratories: vi.fn() }))
vi.mock('@/modules/device/api/devices', () => ({ getDevices: vi.fn(), getTelemetrySnapshots: vi.fn() }))
beforeEach(() => vi.clearAllMocks())
describe('overview data source', () => {
  it('requests all visible classrooms and filters sensors from devices and snapshots', async () => {
    vi.mocked(getLaboratories).mockResolvedValue(data.laboratories)
    vi.mocked(getDevices).mockResolvedValue(data.devices)
    vi.mocked(getTelemetrySnapshots).mockResolvedValue(data.snapshots)
    const controller = new AbortController()
    const result = await getDashboard(controller.signal)
    expect(getLaboratories).toHaveBeenCalledWith([], [])
    expect(getDevices).toHaveBeenCalledWith(data.laboratories.map((room) => room.id), controller.signal)
    expect(result.devices).toHaveLength(8)
    expect(result.snapshots).toHaveLength(8)
  })
  it('does not request empty device scopes', async () => {
    vi.mocked(getLaboratories).mockResolvedValue([])
    expect(await getDashboard()).toEqual({ laboratories: [], devices: [], snapshots: [] })
    expect(getDevices).not.toHaveBeenCalled()
    expect(getTelemetrySnapshots).not.toHaveBeenCalled()
  })
  it('stops before device loading if the account query was cancelled', async () => {
    vi.mocked(getLaboratories).mockResolvedValue(data.laboratories)
    const controller = new AbortController()
    controller.abort()
    await expect(getDashboard(controller.signal)).rejects.toThrow()
    expect(getDevices).not.toHaveBeenCalled()
  })
})
