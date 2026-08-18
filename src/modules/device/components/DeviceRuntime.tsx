import { useEffect } from 'react'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { startDeviceRuntime } from '../realtime/deviceRealtime'
import { useNotificationStore } from '@/modules/notification/store/notificationStore'

export function DeviceRuntime() {
  const userId = useAuthStore((state) => state.user?.id)

  useEffect(() => {
    if (!userId) return
    const stop = startDeviceRuntime()
    return () => {
      stop()
      useNotificationStore.getState().reset()
    }
  }, [userId])

  return null
}
