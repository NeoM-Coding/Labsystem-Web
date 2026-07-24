import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { deleteSession } from '@/modules/auth/api/sessions'
import { useDeviceStore } from '@/modules/device/store/deviceStore'
import { LaboratoryFilterBar } from '@/modules/laboratory/components/LaboratoryFilterBar'
import { queryClient } from '@/shared/lib/queryClient'

export function AppLayout() {
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)
  const location = useLocation()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const isComponentPreview = location.pathname.startsWith('/previews/')

  const logout = async () => {
    setLoggingOut(true)
    setLogoutError(null)
    try {
      await deleteSession()
      useDeviceStore.getState().reset()
      queryClient.clear()
      clearSession()
      navigate('/login', { replace: true })
    } catch (cause) {
      setLogoutError(cause instanceof Error ? cause.message : '退出登录失败，请稍后重试')
      setLoggingOut(false)
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span>LAB</span><strong>实验室管理系统</strong></div>
        <nav className="nav-list" aria-label="主导航">
          <NavLink to="/dashboard">工作台</NavLink>
          <NavLink to="/devices">设备中心</NavLink>
          <NavLink to="/previews/laboratory-filter">筛选栏预览</NavLink>
          <NavLink to="/previews/device-switch-bars">设备切换栏预览</NavLink>
          <NavLink to="/previews/device-data-center">设备中心预览</NavLink>
          <NavLink to="/previews/device-control">设备控制预览</NavLink>
        </nav>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <span>管理控制台</span>
          <div className="relative flex items-center gap-2">
            {logoutError && (
              <p role="alert" className="absolute right-0 top-[calc(100%+8px)] z-20 m-0 whitespace-nowrap rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 shadow-lg">
                {logoutError}
              </p>
            )}
            <div className="user-chip"><span>{user?.name.slice(0, 1) ?? '管'}</span>{user?.name ?? '管理员'}</div>
            <button
              type="button"
              disabled={loggingOut}
              onClick={() => void logout()}
              className="rounded-xl px-3 py-2 text-sm font-bold text-[#61726a] transition-[background-color,color,transform,opacity] duration-150 hover:bg-[#edf3f0] hover:text-[#1e3a30] active:scale-[.97] disabled:cursor-wait disabled:opacity-55"
            >
              {loggingOut ? '正在退出…' : '退出'}
            </button>
          </div>
        </header>
        {!isComponentPreview && (
          <LaboratoryFilterBar />
        )}
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  )
}
