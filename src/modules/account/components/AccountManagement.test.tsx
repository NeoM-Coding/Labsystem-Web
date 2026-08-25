import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Laboratory } from '@/modules/laboratory/types'
import { useAccountStore } from '../store/accountStore'
import { useAuthStore } from '@/modules/auth/store/authStore'
import type { ManagedUser } from '../types'
import { AccountManagement } from './AccountManagement'
import type { AccountManagementDataSource } from './AccountManagement'

const user: ManagedUser = {
  id: 'user-1',
  name: '张老师',
  username: 'zhang',
  phone: '13800000000',
  email: 'zhang@example.edu.cn',
  mark: '实验中心管理员',
  createAt: '2026-07-01T08:00:00Z',
}

const laboratory: Laboratory = {
  id: 'lab-1',
  laboratoryName: '16-201',
  buildingName: '创新楼',
  orgName: '计算机学院',
  extra: null,
  managers: [],
  createAt: '',
  updateAt: '',
}

function dataSource(overrides: Partial<AccountManagementDataSource> = {}): AccountManagementDataSource {
  return {
    listUsers: vi.fn().mockResolvedValue([user]),
    listUserPermissions: vi.fn().mockImplementation(async (userId: string) => userId === 'operator-1'
      ? ['user_manager', 'user_viewer']
      : ['user_viewer', 'smart_manager']),
    listLaboratories: vi.fn().mockResolvedValue([laboratory]),
    createUser: vi.fn().mockImplementation(async (draft) => ({ id: 'user-2', ...draft })),
    updateUser: vi.fn().mockImplementation(async (id, draft) => ({ ...user, id, ...draft.user })),
    createContact: vi.fn().mockImplementation(async (draft) => ({ id: 'contact-1', ...draft })),
    ...overrides,
  }
}

describe('AccountManagement', () => {
  afterEach(() => {
    cleanup()
    useAccountStore.getState().clear()
    useAuthStore.getState().clearSession()
  })

  it('loads users into a searchable management table', async () => {
    render(<AccountManagement dataSource={dataSource()} />)

    expect(await screen.findByText('张老师')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '用户名' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '新增用户' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '新增联系人' })).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('搜索姓名、用户名、邮箱或用户 ID'), {
      target: { value: '不存在' },
    })
    expect(screen.getByText('没有符合搜索条件的用户')).toBeInTheDocument()
  })

  it('opens an extensible permission tree from a listed user', async () => {
    useAuthStore.getState().setSession({ id: 'operator-1', name: '管理员' })
    render(<AccountManagement dataSource={dataSource()} />)
    await screen.findByText('张老师')

    fireEvent.click(screen.getByRole('button', { name: '编辑与授权' }))

    expect(screen.getByRole('dialog', { name: '编辑用户与授权' })).toBeInTheDocument()
    expect(screen.getByText('系统管理')).toBeInTheDocument()
    expect(screen.getByText('教务管理')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText('选择用户查看')).toBeChecked())
    expect(screen.getByLabelText('选择用户管理')).not.toBeChecked()
    expect(screen.getByLabelText('选择用户管理')).not.toBeDisabled()
    expect(screen.getByLabelText('选择策略管理')).toBeChecked()
    expect(screen.getByLabelText('选择策略管理')).toBeDisabled()
    expect(screen.getByText(/已回显用户现有权限/)).toBeInTheDocument()
  })

  it('creates a contact from the search toolbar', async () => {
    const createContact = vi.fn().mockResolvedValue({ id: 'contact-1', name: '李老师' })
    render(<AccountManagement dataSource={dataSource({ createContact })} />)
    await screen.findByText('张老师')

    fireEvent.click(screen.getByRole('button', { name: '新增联系人' }))
    fireEvent.change(screen.getByLabelText('姓名'), { target: { value: '李老师' } })
    fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'li@example.edu.cn' } })
    fireEvent.click(screen.getByRole('button', { name: '保存' }))

    await waitFor(() => expect(createContact).toHaveBeenCalledWith(expect.objectContaining({
      name: '李老师',
      email: 'li@example.edu.cn',
    })))
    expect(await screen.findByText('联系人“李老师”已创建')).toBeInTheDocument()
  })
})
