import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { deleteSession } from '@/modules/auth/api/sessions'
import { useDeviceStore } from '@/modules/device/store/deviceStore'
import { DeviceRuntime } from '@/modules/device/components/DeviceRuntime'
import { queryClient } from '@/shared/lib/queryClient'
import { useLaboratoryStore } from '@/modules/laboratory/store/laboratoryStore'
import { useStrategyStore } from '@/modules/strategy/store/strategyStore'
import { useAccountStore } from '@/modules/account/store/accountStore'

const navigationItems = [
  { to: '/previews/laboratory-filter', label: '筛选栏预览', icon: 'filter' },
  { to: '/previews/device-switch-bars', label: '设备切换栏预览', icon: 'switch' },
  { to: '/previews/device-data-center', label: '设备中心预览', icon: 'grid' },
  { to: '/previews/device-control', label: '设备控制预览', icon: 'control' },
  { to: '/previews/device-management', label: '设备管理预览', icon: 'manage' },
  { to: '/previews/laboratory-management', label: '实验室管理预览', icon: 'laboratory' },
  { to: '/previews/account-management', label: '用户管理预览', icon: 'user' },
  { to: '/previews/strategy-management', label: '策略管理预览', icon: 'strategy' },
  { to: '/previews/strategy-revision-form', label: '策略动态表单预览', icon: 'strategy' },
] as const

type NavigationIconName = typeof navigationItems[number]['icon'] | 'dashboard' | 'device' | 'preview'

function NavigationIcon({ name }: { name: NavigationIconName }) {
  const path = {
    dashboard: 'M3 3h7v7H3zM14 3h7v4h-7zM14 11h7v10h-7zM3 14h7v7H3z',
    device: 'M5 4h14v12H5zM9 20h6M12 16v4M8 8h8',
    filter: 'M4 5h16M7 12h10M10 19h4',
    switch: 'M7 7h13m0 0-3-3m3 3-3 3M17 17H4m0 0 3-3m-3 3 3 3',
    grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
    control: 'M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6',
    manage: 'M4 5h16v14H4zM8 9h8M8 13h5',
    laboratory: 'M4 20h16M6 20V8l6-4 6 4v12M9 11h2m2 0h2M9 15h2m2 0h2',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c.7-4 3-6 7-6s6.3 2 7 6',
    strategy: 'M5 6h14M5 12h9M5 18h6M17 10l2 2-4 4',
    preview: 'M4 5h16v14H4zM8 9h8M8 13h5',
  }[name]
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="nav-icon">
      <path d={path} />
    </svg>
  )
}

export function AppLayout() {
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)
  const location = useLocation()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => window.localStorage.getItem('lab-sidebar-collapsed') === 'true',
  )
  const [deviceMenuOpen, setDeviceMenuOpen] = useState(
    () => window.location.pathname.startsWith('/devices'),
  )
  const [previewMenuOpen, setPreviewMenuOpen] = useState(
    () => window.location.pathname.startsWith('/previews/'),
  )
  const isComponentPreview = location.pathname.startsWith('/previews/')
  const toggleSidebar = () => {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed
      window.localStorage.setItem('lab-sidebar-collapsed', String(next))
      return next
    })
  }
  const logout = async () => {
    setLoggingOut(true)
    setLogoutError(null)
    try {
      await deleteSession()
      useDeviceStore.getState().reset()
      useLaboratoryStore.getState().reset()
      useStrategyStore.getState().reset()
      useAccountStore.getState().clear()
      queryClient.clear()
      clearSession()
      navigate('/login', { replace: true })
    } catch (cause) {
      setLogoutError(cause instanceof Error ? cause.message : '退出登录失败，请稍后重试')
      setLoggingOut(false)
    }
  }

  return (
    <div className="app-shell" data-sidebar-collapsed={sidebarCollapsed}>
      {!isComponentPreview && <DeviceRuntime />}
      <aside className="sidebar">
        <div className="brand">
          <span>LAB</span>
          <strong className="sidebar-label">实验室管理系统</strong>
        </div>
        <button
          type="button"
          className="sidebar-collapse-button"
          aria-label={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
          aria-expanded={!sidebarCollapsed}
          onClick={toggleSidebar}
        >
          <svg aria-hidden="true" viewBox="0 0 20 20">
            <path d="m12.5 5-5 5 5 5" />
          </svg>
        </button>
        <nav className="nav-list" aria-label="主导航">
          <NavLink to="/dashboard" title={sidebarCollapsed ? '工作台' : undefined}>
            <NavigationIcon name="dashboard" />
            <span className="sidebar-label">工作台</span>
          </NavLink>
          <div className="nav-group" data-open={deviceMenuOpen}>
            <button
              type="button"
              className={location.pathname.startsWith('/devices') ? 'active' : ''}
              aria-expanded={deviceMenuOpen}
              title={sidebarCollapsed ? '设备中心' : undefined}
              onClick={() => setDeviceMenuOpen((open) => !open)}
            >
              <NavigationIcon name="device" />
              <span className="sidebar-label">设备中心</span>
              <svg aria-hidden="true" className="nav-group-chevron sidebar-label" viewBox="0 0 20 20"><path d="m6.5 8 3.5 3.5L13.5 8" /></svg>
            </button>
            {deviceMenuOpen && (
              <div className="nav-submenu">
                <NavLink end to="/devices" title={sidebarCollapsed ? '数据中心' : undefined}><span className="nav-submenu-dot" /><span className="sidebar-label">数据中心</span></NavLink>
                <NavLink to="/devices/manage" title={sidebarCollapsed ? '设备管理' : undefined}><span className="nav-submenu-dot" /><span className="sidebar-label">设备管理</span></NavLink>
              </div>
            )}
          </div>
          <NavLink to="/laboratories/manage" title={sidebarCollapsed ? '实验室管理' : undefined}>
            <NavigationIcon name="laboratory" />
            <span className="sidebar-label">实验室管理</span>
          </NavLink>
          <NavLink to="/strategies" title={sidebarCollapsed ? '智能策略' : undefined}>
            <NavigationIcon name="strategy" />
            <span className="sidebar-label">智能策略</span>
          </NavLink>
          <NavLink to="/accounts" title={sidebarCollapsed ? '用户与联系人' : undefined}>
            <NavigationIcon name="user" />
            <span className="sidebar-label">用户与联系人</span>
          </NavLink>
          <div className="nav-group" data-open={previewMenuOpen}>
            <button
              type="button"
              className={location.pathname.startsWith('/previews/') ? 'active' : ''}
              aria-expanded={previewMenuOpen}
              title={sidebarCollapsed ? '组件预览' : undefined}
              onClick={() => setPreviewMenuOpen((open) => !open)}
            >
              <NavigationIcon name="preview" />
              <span className="sidebar-label">组件预览</span>
              <svg aria-hidden="true" className="nav-group-chevron sidebar-label" viewBox="0 0 20 20"><path d="m6.5 8 3.5 3.5L13.5 8" /></svg>
            </button>
            {previewMenuOpen && (
              <div className="nav-submenu">
                {navigationItems.map((item) => (
                  <NavLink key={item.to} to={item.to} title={sidebarCollapsed ? item.label : undefined}>
                    <span className="nav-submenu-dot" />
                    <span className="sidebar-label">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
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
            {isComponentPreview ? (
              <span className="rounded-full bg-[#e5f4ed] px-3 py-1.5 text-xs font-bold text-[#176c4e]">本地预览模式</span>
            ) : (
              <>
                <div className="user-chip"><span>{user?.name.slice(0, 1) ?? '管'}</span>{user?.name ?? '管理员'}</div>
                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={() => void logout()}
                  className="rounded-xl px-3 py-2 text-sm font-bold text-[#61726a] transition-[background-color,color,transform,opacity] duration-150 hover:bg-[#edf3f0] hover:text-[#1e3a30] active:scale-[.97] disabled:cursor-wait disabled:opacity-55"
                >
                  {loggingOut ? '正在退出…' : '退出'}
                </button>
              </>
            )}
          </div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  )
}
