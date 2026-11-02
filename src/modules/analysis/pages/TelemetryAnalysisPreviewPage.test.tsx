import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TelemetryAnalysisPreviewPage from './TelemetryAnalysisPreviewPage'
import * as api from '../api/telemetry'
vi.mock('../charts/TelemetryChart', () => ({
  TelemetryChart: ({ label }: { label: string }) => <div role="img" aria-label={label} />,
}))


function preview() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><TelemetryAnalysisPreviewPage /></QueryClientProvider>)
}
describe('business telemetry report', () => {
  afterEach(cleanup)
  it('defaults every dimension to all, applies server-shaped filters and keeps totals aligned with rows', async () => {
    const load = vi.spyOn(api, 'getTelemetryDashboard')
    const options = vi.spyOn(api, 'getTelemetryOptions')
    preview()
    expect(screen.getByRole('heading', { name: '空调运行数据统计' })).toBeInTheDocument()
    await screen.findByText('共 8 条统计记录')
    for (const label of ['楼栋', '单位', '实验室', '内机名称']) expect(screen.getByRole('button', { name: label + '：全部' })).toBeInTheDocument()
    for (const name of ['序号', '内机名称', '机组', '实验室', '单位', '楼栋']) expect(screen.getByRole('columnheader', { name })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '楼栋：全部' }))
    const menu = await screen.findByRole('group', { name: '选择楼栋' })
    fireEvent.click(within(menu).getByRole('checkbox', { name: '信息楼' }))
    fireEvent.click(within(menu).getByRole('button', { name: '完成' }))
    expect(screen.getByText('共 8 条统计记录')).toBeInTheDocument()
    expect(screen.getByText('筛选条件已更改，查询后更新结果')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /查询统计/ }))
    await screen.findByText('共 4 条统计记录')
    expect(screen.getAllByText('21.25')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: '重置' }))
    await screen.findByText('共 8 条统计记录')
    fireEvent.change(screen.getByLabelText('分析类型'), { target: { value: 'energy' } })
    await screen.findByText('总能耗')
    expect(screen.getByRole('columnheader', { name: '空开名称' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: '机组' })).not.toBeInTheDocument()
    expect(load).not.toHaveBeenCalled()
    expect(options).not.toHaveBeenCalled()
    load.mockRestore(); options.mockRestore()
  })
  it('supports device search, escape focus return, custom dates and empty data', async () => {
    preview()
    await screen.findByText('共 8 条统计记录')
    const trigger = screen.getByRole('button', { name: '内机名称：全部' })
    fireEvent.click(trigger)
    const search = screen.getByRole('textbox', { name: '搜索内机名称' })
    fireEvent.change(search, { target: { value: '不存在的内机' } })
    expect(screen.getByText('没有找到匹配项')).toBeInTheDocument()
    fireEvent.keyDown(search, { key: 'Escape' })
    expect(trigger).toHaveFocus()
    expect(screen.queryByRole('group', { name: '选择内机名称' })).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('开始日期'), { target: { value: '2026-10-01' } })
    fireEvent.change(screen.getByLabelText('结束日期'), { target: { value: '2026-10-02' } })
    fireEvent.click(screen.getByRole('button', { name: /查询统计/ }))
    await screen.findByText('暂无统计记录')
    expect(screen.getByText(/预览输出/)).toHaveTextContent('"range":"CUSTOM"')
    fireEvent.change(screen.getByLabelText('输出状态'), { target: { value: 'partial' } })
    await screen.findByText('部分时段数据不完整')
    fireEvent.change(screen.getByLabelText('输出状态'), { target: { value: 'loading' } })
    expect(screen.getByText('正在汇总统计数据…')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('输出状态'), { target: { value: 'error' } })
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('统计暂时无法加载'))
  })
})
