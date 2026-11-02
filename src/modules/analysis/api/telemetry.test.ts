import { describe, expect, it, vi } from 'vitest'
import { http } from '@/shared/api/http'
import { getTelemetryDashboard } from './telemetry'

describe('telemetry API', () => {
  it('forwards custom dates and repeated laboratory IDs', async () => {
    const get = vi.spyOn(http, 'get').mockResolvedValue({ data: { code: 0, ok: true, data: { kind: 'ENERGY' } } })
    await getTelemetryDashboard('energy', 'CUSTOM', ['lab-a', 'lab-b'], '2026-09-01', '2026-09-02', { buildingNames: ['楼 A', '楼 B'], orgNames: ['单位'], deviceIds: ['device-1', 'device-2'] })
    const [path, config] = get.mock.calls[0]
    expect(path).toBe('/bi/energy/dashboard')
    const params = config?.params as URLSearchParams
    expect(params.getAll('laboratoryIds')).toEqual(['lab-a', 'lab-b'])
    expect(params.get('startDate')).toBe('2026-09-01')
    expect(params.get('endDate')).toBe('2026-09-02')
    expect(params.getAll('buildingNames')).toEqual(['楼 A', '楼 B'])
    expect(params.getAll('orgNames')).toEqual(['单位'])
    expect(params.getAll('deviceIds')).toEqual(['device-1', 'device-2'])
    get.mockRestore()
  })
})
