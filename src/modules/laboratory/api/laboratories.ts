import { apiRequest, http } from '@/shared/api/http'
import type { ApiResponse, Laboratory, LaboratoryDraft, OptionPair } from '../types'

interface LaboratoryWriteResponse extends Omit<Laboratory, 'managers'> {
  manager?: Laboratory['managers']
  managers?: Laboratory['managers']
}

function normalizeLaboratory(laboratory: LaboratoryWriteResponse): Laboratory {
  return {
    ...laboratory,
    managers: laboratory.managers ?? laboratory.manager ?? [],
  }
}

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.ok) {
    throw new Error(response.msg || '请求实验室数据失败')
  }
  return response.data
}

export async function getBuildingOptions(): Promise<OptionPair[]> {
  const { data } = await http.get<ApiResponse<OptionPair[]>>('/laboratories/options/buildings')
  return unwrap(data)
}

export async function getOrganizationOptions(): Promise<OptionPair[]> {
  const { data } = await http.get<ApiResponse<OptionPair[]>>('/laboratories/options/organizations')
  return unwrap(data)
}

export async function getLaboratories(
  buildingNames: string[],
  orgNames: string[],
): Promise<Laboratory[]> {
  const params = new URLSearchParams()
  buildingNames.forEach((name) => params.append('buildingNames', name))
  orgNames.forEach((name) => params.append('orgNames', name))

  const { data } = await http.get<ApiResponse<Laboratory[]>>('/laboratories', { params })
  return unwrap(data)
}

export function createLaboratory(draft: LaboratoryDraft) {
  return apiRequest<LaboratoryWriteResponse>(
    () => http.post('/laboratories', draft),
    '创建实验室失败',
  ).then(normalizeLaboratory)
}

export function updateLaboratory(laboratoryId: string, draft: LaboratoryDraft) {
  return apiRequest<LaboratoryWriteResponse>(
    () => http.put(`/laboratories/${laboratoryId}`, draft),
    '更新实验室失败',
  ).then(normalizeLaboratory)
}

export async function deleteLaboratory(laboratoryId: string) {
  await apiRequest<null>(
    () => http.delete(`/laboratories/${laboratoryId}`),
    '删除实验室失败',
  )
}
