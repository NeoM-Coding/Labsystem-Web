import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from '@/shared/lib/queryClient'
import { DeviceRuntime } from '@/modules/device/components/DeviceRuntime'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { router } from './router'

export function App() {
  const authenticated = useAuthStore((state) => Boolean(state.user))

  return (
    <QueryClientProvider client={queryClient}>
      {authenticated && <DeviceRuntime />}
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
