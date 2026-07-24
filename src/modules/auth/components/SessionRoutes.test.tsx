import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { GuestOnlyRoute, RequireSession } from './SessionRoutes'

function LoginTarget() {
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } } | null)?.from
  return <div>登录页:{from?.pathname ?? 'none'}</div>
}

describe('session routes', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
  })

  it('falls back to login and preserves the protected destination', () => {
    render(
      <MemoryRouter initialEntries={['/devices']}>
        <Routes>
          <Route path="/login" element={<LoginTarget />} />
          <Route element={<RequireSession />}>
            <Route path="/devices" element={<div>设备中心</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('登录页:/devices')).toBeInTheDocument()
  })

  it('renders protected content for an authenticated user', () => {
    useAuthStore.getState().setSession({
      id: 'user-1',
      name: '管理员',
      username: 'admin',
    })

    render(
      <MemoryRouter initialEntries={['/devices']}>
        <Routes>
          <Route element={<RequireSession />}>
            <Route path="/devices" element={<div>设备中心</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('设备中心')).toBeInTheDocument()
  })

  it('keeps authenticated users out of the login page', () => {
    useAuthStore.getState().setSession({
      id: 'user-1',
      name: '管理员',
      username: 'admin',
    })

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<GuestOnlyRoute />}>
            <Route path="/login" element={<div>登录页</div>} />
          </Route>
          <Route path="/devices" element={<div>设备中心</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('设备中心')).toBeInTheDocument()
  })
})
