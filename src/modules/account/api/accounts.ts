import { apiRequest, http } from '@/shared/api/http'
import type {
  ContactCreateDraft,
  ManagedUser,
  UserCreateDraft,
  UserUpdateDraft,
} from '../types'

export function listUsers(keyword = '') {
  return apiRequest<ManagedUser[]>(
    () => http.get('/users', {
      params: keyword.trim() ? { keyword: keyword.trim() } : undefined,
    }),
    '加载用户与联系人失败',
  )
}

export function listUserPermissions(userId: string) {
  return apiRequest<string[]>(
    () => http.get(`/users/${userId}/permissions`),
    '加载用户权限失败',
  )
}

export function createUser(draft: UserCreateDraft) {
  return apiRequest<ManagedUser>(
    () => http.post('/users', draft),
    '创建系统用户失败',
  )
}

export function updateUser(userId: string, draft: UserUpdateDraft) {
  return apiRequest<ManagedUser>(
    () => http.put(`/users/${userId}`, draft),
    '更新系统用户失败',
  )
}

export function createContact(draft: ContactCreateDraft) {
  return apiRequest<ManagedUser>(
    () => http.post('/contacts', draft),
    '创建联系人失败',
  )
}
