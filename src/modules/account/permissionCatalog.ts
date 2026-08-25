import type { PermissionTreeNode } from './types'

export const defaultPermissionTree: PermissionTreeNode[] = [
  {
    id: 'system',
    label: '系统管理',
    description: '系统级身份与账号管理能力',
    children: [
      { id: 'super-admin', label: '系统超级管理员', description: '拥有全部系统权限', relation: 'super_admin' },
      {
        id: 'account',
        label: '账号管理',
        children: [
          { id: 'user-manager', label: '用户管理', relation: 'user_manager' },
          { id: 'user-viewer', label: '用户查看', relation: 'user_viewer' },
        ],
      },
    ],
  },
  {
    id: 'laboratory',
    label: '实验室管理',
    children: [
      { id: 'laboratory-manager', label: '实验室资料管理', relation: 'laboratory_manager' },
    ],
  },
  {
    id: 'education',
    label: '教务管理',
    children: [
      {
        id: 'semester',
        label: '学期设置',
        children: [
          { id: 'semester-manager', label: '添加、修改与删除', relation: 'edu_semester_manager' },
          { id: 'semester-viewer', label: '查看', relation: 'edu_semester_viewer' },
        ],
      },
      {
        id: 'timetable',
        label: '实验室课表',
        children: [
          { id: 'timetable-manager', label: '添加、修改与删除', relation: 'edu_timetable_manager' },
          { id: 'timetable-viewer', label: '查看', relation: 'edu_timetable_viewer' },
        ],
      },
    ],
  },
  {
    id: 'strategy',
    label: '智能策略',
    children: [
      { id: 'smart-manager', label: '策略管理', relation: 'smart_manager' },
      { id: 'smart-viewer', label: '策略查看', relation: 'smart_viewer' },
      { id: 'smart-keeper', label: '策略值守', relation: 'smart_keeper' },
    ],
  },
  {
    id: 'logs',
    label: '日志审计',
    children: [
      { id: 'log-viewer', label: '查看审计与告警日志', relation: 'log_viewer' },
    ],
  },
  {
    id: 'analysis',
    label: '数据分析',
    children: [
      { id: 'data-analyst', label: '分析数据访问', relation: 'data_analyst' },
    ],
  },
]
