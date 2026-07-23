import { http } from '@/shared/api/http'
import type { ApiResponse } from '@/modules/laboratory/types'
import type { User } from '../types'

interface UserSession {
  user: User
  tokenName: string
  tokenValue: string
}

export async function createSession(username: string, password: string) {
  const { data } = await http.post<ApiResponse<UserSession>>('/sessions', { username, password })
  if (!data.ok) throw new Error(data.msg || '登录失败')
  return data.data
}
