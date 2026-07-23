import { useEffect } from 'react'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { startDeviceRuntime } from '../realtime/deviceRealtime'

export function DeviceRuntime() {
  const userId = useAuthStore((state) => state.user?.id)

  useEffect(() => {
    if (!userId) return
    return startDeviceRuntime()
  }, [userId])

  return null
}
