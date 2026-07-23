import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from '@/shared/lib/queryClient'
import { DeviceRuntime } from '@/modules/device/components/DeviceRuntime'
import { router } from './router'

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DeviceRuntime />
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
