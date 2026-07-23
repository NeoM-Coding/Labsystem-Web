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
  managers: unknown[]
  createAt: string
  updateAt: string
}
