import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'
import { apiRequest, http } from './http'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { useApiErrors } from './apiErrors'

describe('shared HTTP boundary', () => {
  beforeEach(() => useApiErrors.setState({ errors: [] }))
  it('returns successful payloads', async () => {
    const result = await apiRequest(() => http.get('/test', { adapter: async (config) => ({ config, status: 200, statusText: 'OK', headers: {}, data: { code: 200, ok: true, data: 42, msg: '成功' } }) }))
    expect(result).toBe(42)
  })
  it('accepts Excel attachments without a JSON envelope', async () => {
    const data = new Blob(['xlsx'])
    const response = await http.get('/edu/timetables/import-template', { responseType: 'blob', adapter: async (config) => ({ config, status: 200, statusText: 'OK', headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }, data }) })
    expect(response.data).toBe(data)
    expect(useApiErrors.getState().errors).toHaveLength(0)
  })
  it.each([200, 403])('decodes download errors returned as JSON blobs with status %s', async (status) => {
    const data = new Blob([])
    Object.defineProperty(data, 'text', { value: async () => JSON.stringify({ code: 110002, ok: false, msg: '无权下载' }) })
    const operation = http.get('/edu/timetables/import-template', { responseType: 'blob', adapter: async (config) => {
      const response = { config, status, statusText: 'error', headers: { 'content-type': 'application/json' }, data }
      if (status >= 400) throw new AxiosError('failure', 'ERR_BAD_RESPONSE', config, undefined, response)
      return response
    } })
    await expect(operation).rejects.toMatchObject({ message: '无权下载', httpStatus: status })
    expect(useApiErrors.getState().errors).toHaveLength(1)
  })
  it.each([200, 504])('reports a failure exactly once for HTTP %s', async (status) => {
    const operation = () => http.get('/test', { adapter: async (config) => {
      const response = { config, status, statusText: 'failure', headers: {}, data: { code: 130001, ok: false, data: null, msg: '设备超时' } }
      if (status >= 400) throw new AxiosError('failure', 'ERR_BAD_RESPONSE', config, undefined, response)
      return response
    } })
    await expect(apiRequest(operation)).rejects.toMatchObject({ code: 130001, httpStatus: status, message: '设备超时' })
    expect(useApiErrors.getState().errors).toHaveLength(1)
  })
  it('allows callers to handle errors locally', async () => {
    await expect(http.get('/test', { errorPolicy: 'local', adapter: async (config) => ({ config, status: 200, statusText: 'OK', headers: {}, data: { code: 100001, ok: false, msg: '字段错误' } }) })).rejects.toMatchObject({ policy: 'local' })
    expect(useApiErrors.getState().errors).toHaveLength(0)
  })
  it('clears expired sessions but keeps failed login requests local', async () => {
    window.history.replaceState({}, '', '/login')
    const clear = vi.spyOn(useAuthStore.getState(), 'clearSession')
    const adapter: NonNullable<import('axios').AxiosRequestConfig['adapter']> = async (config) => {
      const response = { config, status: 401, statusText: 'Unauthorized', headers: {}, data: { code: 110001, ok: false, msg: '登录过期' } }
      throw new AxiosError('unauthorized', 'ERR_BAD_REQUEST', config, undefined, response)
    }
    await expect(http.post('/sessions', {}, { errorPolicy: 'local', adapter })).rejects.toMatchObject({ code: 110001 })
    expect(clear).not.toHaveBeenCalled()
    await expect(http.get('/devices', { adapter })).rejects.toMatchObject({ code: 110001 })
    expect(clear).toHaveBeenCalledOnce()
    clear.mockRestore()
    window.history.replaceState({}, '', '/')
  })

})
