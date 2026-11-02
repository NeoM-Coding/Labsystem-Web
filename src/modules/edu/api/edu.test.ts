import { afterEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/shared/api/http'
import { exportTimetables } from './edu'

describe('printable timetable download', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })
  it('requests all explicitly selected laboratories and downloads an Excel attachment', async () => {
    vi.useFakeTimers()
    const createObjectURL = vi.fn(() => 'blob:printable-timetable')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', class extends URL {
      static createObjectURL = createObjectURL
      static revokeObjectURL = revokeObjectURL
    })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const content = new Blob(['xlsx'])
    const get = vi.spyOn(http, 'get').mockResolvedValue({ data: content })
    await exportTimetables('semester-1', ['lab-a', 'lab-b'])
    expect(get).toHaveBeenCalledOnce()
    const [url, config] = get.mock.calls[0]
    expect(url).toBe('/edu/timetables/export')
    expect(config?.responseType).toBe('blob')
    expect((config?.params as URLSearchParams).getAll('laboratoryIds')).toEqual(['lab-a', 'lab-b'])
    expect((config?.params as URLSearchParams).get('semesterId')).toBe('semester-1')
    expect(createObjectURL).toHaveBeenCalledWith(content)
    expect(click).toHaveBeenCalledOnce()
    await vi.runAllTimersAsync()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:printable-timetable')
  })
})
