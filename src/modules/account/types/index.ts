export interface ManagedUser {
  id: string
  name: string
  username?: string
  password?: string
  phone?: string
  email?: string
  mark?: string
  createAt?: string
  updateAt?: string
}

export interface PermissionTreeNode {
  id: string
  label: string
  description?: string
  relation?: AppRelation
  children?: PermissionTreeNode[]
}

export type AppRelation =
  | 'super_admin'
  | 'user_manager'
  | 'user_viewer'
  | 'edu_semester_manager'
  | 'edu_semester_viewer'
  | 'edu_timetable_manager'
  | 'edu_timetable_viewer'
  | 'laboratory_manager'
  | 'smart_manager'
  | 'smart_viewer'
  | 'smart_keeper'
  | 'log_viewer'
  | 'data_analyst'

export interface UserCreateDraft {
  name: string
  username: string
  password: string
  phone: string
  email: string
  mark: string
  appRelations: AppRelation[]
}

export interface UserUpdateDraft {
  user: Partial<ManagedUser>
  appRelations: AppRelation[]
}

export interface ContactCreateDraft {
  name: string
  phone: string
  email: string
  mark: string
}
