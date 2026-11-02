import { beforeEach, describe, expect, it } from 'vitest'
import { AxiosError, CanceledError } from 'axios'
import { ApiError, errorFromResponse, normalizeApiError, reportApiError, useApiErrors, localErrorMessage } from './apiErrors'
import { ErrorCode } from './errorCodes'

describe('API error contract', () => {
  beforeEach(() => useApiErrors.setState({ errors: [] }))
  it('preserves code, HTTP status, data and trace independently', () => {
    const error = errorFromResponse({ code: 130001, msg: '设备超时', data: { deviceId: '1' }, traceId: 'trace-1' }, 504, 'global')
    expect(error).toMatchObject({ code: 130001, httpStatus: 504, message: '设备超时', data: { deviceId: '1' }, traceId: 'trace-1' })
  })
  it('handles unknown codes, empty and non-JSON responses', () => {
    expect(errorFromResponse({ code: 999999 }, 500, 'global').message).toBe('请求失败，请稍后重试')
    expect(errorFromResponse('<html>Bad gateway</html>', 502, 'global').message).toBeTruthy()
    expect(errorFromResponse(null, 504, 'global').message).toBeTruthy()
  })
  it('distinguishes browser timeout, network failure and cancellation', () => {
    expect(normalizeApiError(new AxiosError('timeout', 'ECONNABORTED')).code).toBe(ErrorCode.REQUEST_TIMEOUT)
    expect(normalizeApiError(new AxiosError('network', 'ERR_NETWORK')).kind).toBe('network')
    const cancelled = normalizeApiError(new CanceledError())
    reportApiError(cancelled)
    expect(cancelled.kind).toBe('cancelled')
    expect(useApiErrors.getState().errors).toHaveLength(0)
  })
  it('deduplicates notifications and honors local and silent handling', () => {
    reportApiError(new ApiError(130001, 504, '超时'))
    reportApiError(new ApiError(130001, 504, '超时'))
    const local = new ApiError(100001, 400, '字段错误', undefined, undefined, 'business', 'local')
    reportApiError(local)
    reportApiError(new ApiError(100002, 500, '后台探测', undefined, undefined, 'business', 'silent'))
    expect(useApiErrors.getState().errors).toHaveLength(1)
    expect(localErrorMessage(local, '失败')).toBe('字段错误')
    expect(localErrorMessage(useApiErrors.getState().errors[0], '失败')).toBe('')
  })
})
