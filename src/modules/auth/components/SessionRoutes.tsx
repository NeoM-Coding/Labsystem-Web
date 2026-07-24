import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function RequireSession() {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function GuestOnlyRoute() {
  const user = useAuthStore((state) => state.user)

  return user ? <Navigate to="/devices" replace /> : <Outlet />
}
