import { http, apiRequest } from '@/shared/api/http'
import type { User } from '../types'
interface UserSession { user: User; tokenName: string; tokenValue: string }
export function createSession(username: string, password: string) {
  return apiRequest<UserSession>(() => http.post('/sessions', { username, password }, { errorPolicy: 'local' }))
}
export function deleteSession() {
  return apiRequest<null>(() => http.delete('/sessions'))
}
export function getCurrentSession() {
  return apiRequest<UserSession>(() => http.get('/sessions/current', { errorPolicy: 'silent' }))
}
