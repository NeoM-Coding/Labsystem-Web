import axios from 'axios'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { ApiError, errorFromResponse, normalizeApiError, reportApiError } from './apiErrors'
import type { ErrorPolicy } from './apiErrors'
import { ErrorCode } from './errorCodes'

declare module 'axios' {
  interface AxiosRequestConfig { errorPolicy?: ErrorPolicy }
}
export interface ApiEnvelope<T> {
  code: number
  ok: boolean
  data: T
  msg: string
  traceId?: string
}
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 10_000,
  withCredentials: true,
})
function reject(error: ApiError, url?: string, method?: string): Promise<never> {
  const login = method === 'post' && url?.replace(/\?.*$/, '').endsWith('/sessions')
  if ((error.code === ErrorCode.AUTHENTICATION_REQUIRED || error.httpStatus === 401) && !login && error.policy !== 'silent') {
    useAuthStore.getState().clearSession()
    if (window.location.pathname !== '/login') {
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
      window.location.replace(`/login?reason=expired&from=${encodeURIComponent(current)}`)
    }
  }
  reportApiError(error)
  return Promise.reject(error)
}
http.interceptors.response.use(
  async (response) => {
    if (response.config.responseType === 'blob' && response.data instanceof Blob) {
      if (String(response.headers['content-type'] ?? '').includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) return response
      try { response.data = JSON.parse(await response.data.text()) } catch { /* Use normal envelope validation below. */ }
    }
    const body: unknown = response.data
    if (!body || typeof body !== 'object' || !('ok' in body) || body.ok !== true) {
      return reject(errorFromResponse(body, response.status, response.config.errorPolicy ?? 'global'), response.config.url, response.config.method)
    }
    return response
  },
  async (cause: unknown) => {
    if (axios.isAxiosError(cause) && cause.response?.data instanceof Blob) {
      try { cause.response.data = JSON.parse(await cause.response.data.text()) } catch { /* Keep transport error details. */ }
    }
    const config = axios.isAxiosError(cause) ? cause.config : undefined
    return reject(normalizeApiError(cause, config?.errorPolicy ?? 'global'), config?.url, config?.method)
  },
)
export async function apiRequest<T>(
  operation: () => Promise<{ data: ApiEnvelope<T> }>,
  fallbackMessage = '请求失败，请稍后重试',
): Promise<T> {
  const { data } = await operation()
  // Also validates custom adapters/mocks that do not use the shared Axios client.
  if (!data.ok) {
    const error = errorFromResponse(data, 200, 'global')
    if (!data.msg) error.message = fallbackMessage
    reportApiError(error)
    throw error
  }
  return data.data
}
