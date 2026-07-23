import { http } from '@/shared/api/http'
import type { ApiResponse, Laboratory, OptionPair } from '../types'

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
