import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { LaboratoryFilterBar } from '@/modules/laboratory/components/LaboratoryFilterBar'
import { LaboratoryPicker } from '@/modules/laboratory/components/LaboratoryPicker'

export function AppLayout() {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()
  const isComponentPreview = location.pathname.startsWith('/previews/')

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span>LAB</span><strong>实验室管理系统</strong></div>
        <nav className="nav-list" aria-label="主导航">
          <NavLink to="/dashboard">工作台</NavLink>
          <NavLink to="/devices">设备中心</NavLink>
          <NavLink to="/previews/laboratory-filter">筛选栏预览</NavLink>
          <NavLink to="/previews/laboratory-picker">Picker 预览</NavLink>
          <NavLink to="/previews/device-switch-bars">设备切换栏预览</NavLink>
          <NavLink to="/previews/device-data-center">设备中心预览</NavLink>
          <NavLink to="/previews/device-control">设备控制预览</NavLink>
        </nav>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <span>管理控制台</span>
          <div className="user-chip"><span>{user?.name.slice(0, 1) ?? '管'}</span>{user?.name ?? '管理员'}</div>
        </header>
        {!isComponentPreview && (
          <>
            <LaboratoryFilterBar />
            <LaboratoryPicker />
          </>
        )}
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  )
}
