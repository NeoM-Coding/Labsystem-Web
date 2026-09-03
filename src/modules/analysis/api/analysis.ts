import { apiRequest, http } from '@/shared/api/http'
import type { EduDashboard, EduTimeRange } from '../types'

export function getEduDashboard(range: EduTimeRange, laboratoryIds: string[]) {
  const params = new URLSearchParams({ range })
  laboratoryIds.forEach((laboratoryId) => params.append('laboratoryIds', laboratoryId))

  return apiRequest<EduDashboard>(
    () => http.get('/bi/edu/dashboard', { params }),
    '加载教务分析数据失败',
  )
}
