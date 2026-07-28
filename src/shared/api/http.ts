import axios from 'axios'
import { useAuthStore } from '@/modules/auth/store/authStore'

export interface ApiEnvelope<T> {
  code: number
  ok: boolean
  data: T
  msg: string
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 10_000,
  withCredentials: true,
})

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const isLoginRequest = error.config?.method === 'post'
        && error.config.url?.replace(/\?.*$/, '').endsWith('/sessions')

      if (!isLoginRequest) {
        useAuthStore.getState().clearSession()
        const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
        if (window.location.pathname !== '/login') {
          const loginUrl = `/login?reason=expired&from=${encodeURIComponent(current)}`
          window.location.replace(loginUrl)
        }
      }
    }
    return Promise.reject(error)
  },
)

export async function apiRequest<T>(
  operation: () => Promise<{ data: ApiEnvelope<T> }>,
  fallbackMessage = '请求失败，请稍后重试',
): Promise<T> {
  try {
    const envelope = (await operation()).data
    if (!envelope.ok) throw new Error(envelope.msg || fallbackMessage)
    return envelope.data
  } catch (cause) {
    if (axios.isAxiosError<ApiEnvelope<unknown>>(cause)) {
      throw new Error(cause.response?.data?.msg || fallbackMessage)
    }
    throw cause
  }
}
