export interface ApiResponse<T> {
  code: number
  ok: boolean
  data: T
  msg: string
}

export interface OptionPair {
  f: string
  s: string
}

export interface Laboratory {
  id: string
  buildingName: string
  orgName: string | null
  laboratoryName: string
  extra: Record<string, unknown> | null
  managers: LaboratoryManager[]
  createAt: string
  updateAt: string
}

export interface LaboratoryManager {
  id?: string
  name: string
  username?: string
  phone?: string
  email?: string
  mark?: string
}

export interface LaboratoryMembers {
  owners: LaboratoryManager[]
  viewers: LaboratoryManager[]
}

export interface LaboratoryDraft {
  buildingName: string
  orgName: string
  laboratoryName: string
  extra: Record<string, unknown> | null
  manager: LaboratoryManager[]
}
