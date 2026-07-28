import { http } from '@/shared/api/http'
import type { ApiResponse } from '@/modules/laboratory/types'
import type { User } from '../types'
import axios from 'axios'

interface UserSession {
  user: User
  tokenName: string
  tokenValue: string
}

export async function createSession(username: string, password: string) {
  try {
    const { data } = await http.post<ApiResponse<UserSession>>('/sessions', { username, password })
    if (!data.ok) throw new Error(data.msg || '用户名或密码错误')
    return data.data
  } catch (cause) {
    if (axios.isAxiosError<ApiResponse<unknown>>(cause)) {
      throw new Error(cause.response?.data?.msg || '用户名或密码错误')
    }
    throw cause
  }
}

export async function deleteSession() {
  const { data } = await http.delete<ApiResponse<null>>('/sessions')
  if (!data.ok) throw new Error(data.msg || '退出登录失败')
}

export async function getCurrentSession() {
  try {
    const { data } = await http.get<ApiResponse<UserSession>>('/sessions/current')
    if (!data.ok) throw new Error(data.msg || '登录状态无效')
    return data.data
  } catch (cause) {
    if (axios.isAxiosError<ApiResponse<unknown>>(cause)) {
      throw new Error(cause.response?.data?.msg || '登录状态无效')
    }
    throw cause
  }
}
