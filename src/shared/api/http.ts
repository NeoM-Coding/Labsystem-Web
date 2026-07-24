import axios from 'axios'
import { useAuthStore } from '@/modules/auth/store/authStore'

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
