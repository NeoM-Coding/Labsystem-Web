import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DashboardOverview } from './DashboardOverview'
import { dashboardPreviewData, previewNow } from '../pages/dashboardPreviewData'

afterEach(cleanup)
const props = { data: dashboardPreviewData, now: previewNow, updatedAt: previewNow, search: '', onSearchChange: vi.fn(), onRefresh: vi.fn() }
describe('overview presentation', () => {
  it('shows four uniform device categories, classroom empty states and semantic breaker labels', () => {
    render(<DashboardOverview {...props} />)
    expect(screen.queryByText('传感器')).not.toBeInTheDocument()
    expect(screen.getAllByText('暂无概览设备')).toHaveLength(2)
    expect(screen.getAllByText('合闸').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: '概览' })).toBeInTheDocument()
  })
  it('filters only the classroom detail and emits search and refresh events', () => {
    render(<DashboardOverview {...props} search="101" />)
    expect(screen.getByText('智能控制教室 101')).toBeInTheDocument()
    expect(screen.queryByText('电气实验教室 202')).not.toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: '资源汇总' })).getByText('4')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '202' } })
    expect(props.onSearchChange).toHaveBeenCalledWith('202')
    fireEvent.click(screen.getByRole('button', { name: '刷新概览' }))
    expect(props.onRefresh).toHaveBeenCalled()
  })
  it('keeps previous data and update time on refresh failure', () => {
    render(<DashboardOverview {...props} error="请求失败" />)
    expect(screen.getByRole('alert')).toHaveTextContent('当前显示上次成功数据')
    expect(screen.getByRole('status')).toHaveTextContent('更新于')
    expect(screen.getByText('智能控制教室 101')).toBeInTheDocument()
  })
  it('shows loading, initial error and zero-classroom states', () => {
    const view = render(<DashboardOverview {...props} data={undefined} loading />)
    expect(screen.getByLabelText('正在加载概览')).toBeInTheDocument()
    view.rerender(<DashboardOverview {...props} data={undefined} error="请求失败" />)
    expect(screen.getByRole('alert')).toHaveTextContent('概览暂时无法加载')
    view.rerender(<DashboardOverview {...props} data={{ laboratories: [], devices: [], snapshots: [] }} />)
    expect(screen.getByText('暂无可见教室')).toBeInTheDocument()
  })
})
