import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { useLaboratoryFilterStore } from '@/modules/laboratory/store/laboratoryFilterStore'
import { getDashboard } from '../api/dashboard'
import DashboardPage from './DashboardPage'
import { dashboardPreviewData } from './dashboardPreviewData'

vi.mock('../api/dashboard', () => ({ getDashboard: vi.fn() }))
const clients: QueryClient[] = []
afterEach(() => {
  cleanup()
  clients.forEach((client) => client.clear())
  clients.length = 0
  vi.useRealTimers()
  vi.clearAllMocks()
  useAuthStore.setState({ user: null })
  focusManager.setFocused(undefined)
})
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  clients.push(client)
  useAuthStore.setState({ user: { id: 'account-a', name: '甲', username: 'a', roles: [] } })
  return { client, ...render(<QueryClientProvider client={client}><DashboardPage /></QueryClientProvider>) }
}
describe('overview query lifecycle', () => {
  it('isolates account data and does not follow the device-center filter', async () => {
    vi.mocked(getDashboard).mockResolvedValueOnce(dashboardPreviewData).mockImplementationOnce(() => new Promise(() => {}))
    mount()
    await screen.findByText('智能控制教室 101')
    act(() => useLaboratoryFilterStore.setState({ laboratoryIds: ['unrelated-room'] }))
    expect(getDashboard).toHaveBeenCalledTimes(1)
    act(() => useAuthStore.setState({ user: { id: 'account-b', name: '乙', username: 'b', roles: [] } }))
    await waitFor(() => expect(getDashboard).toHaveBeenCalledTimes(2))
    expect(screen.queryByText('智能控制教室 101')).not.toBeInTheDocument()
    expect(screen.getByLabelText('正在加载概览')).toBeInTheDocument()
  })
  it('refreshes manually and on focus and retains data when refresh fails', async () => {
    vi.mocked(getDashboard).mockResolvedValue(dashboardPreviewData)
    mount()
    await screen.findByText('智能控制教室 101')
    fireEvent.click(screen.getByRole('button', { name: '刷新概览' }))
    await waitFor(() => expect(getDashboard).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.getByRole('button', { name: '刷新概览' })).toBeEnabled())
    vi.mocked(getDashboard).mockRejectedValue(new Error('连接失败'))
    act(() => { focusManager.setFocused(false); focusManager.setFocused(true) })
    await screen.findByRole('alert')
    expect(screen.getByText('智能控制教室 101')).toBeInTheDocument()
  })
  it('polls every 30 seconds and stops after unmount', async () => {
    vi.useFakeTimers()
    vi.mocked(getDashboard).mockResolvedValue(dashboardPreviewData)
    const view = mount()
    await act(async () => { await vi.advanceTimersByTimeAsync(100) })
    expect(getDashboard).toHaveBeenCalledTimes(1)
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000) })
    expect(getDashboard).toHaveBeenCalledTimes(2)
    view.unmount()
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000) })
    expect(getDashboard).toHaveBeenCalledTimes(2)
  })
})
