import { apiRequest, http } from '@/shared/api/http'
import type { RuntimeRevision } from '../types'

export const listStrategies = () => apiRequest<RuntimeRevision[]>(
  () => http.get('/smart-strategies'),
  '加载智能策略失败',
)

export const getStrategy = (runtimeId: string) => apiRequest<RuntimeRevision>(
  () => http.get(`/smart-strategies/${runtimeId}`),
  '加载策略详情失败',
)

export const createStrategy = (revision: RuntimeRevision) => apiRequest<RuntimeRevision>(
  () => http.post('/smart-strategies', revision),
  '创建智能策略失败',
)

export const updateStrategy = (runtimeId: string, revision: RuntimeRevision) => apiRequest<RuntimeRevision>(
  () => http.put(`/smart-strategies/${runtimeId}`, revision),
  '更新智能策略失败',
)

export async function deleteStrategy(runtimeId: string) {
  await apiRequest<null>(
    () => http.delete(`/smart-strategies/${runtimeId}`),
    '删除智能策略失败',
  )
}

export const setStrategyEnabled = (runtimeId: string, enabled: boolean) => apiRequest<RuntimeRevision>(
  () => enabled
    ? http.put(`/smart-strategies/${runtimeId}/enabled`)
    : http.delete(`/smart-strategies/${runtimeId}/enabled`),
  enabled ? '启用智能策略失败' : '停用智能策略失败',
)
