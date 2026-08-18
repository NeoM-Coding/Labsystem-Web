import { useLaboratoryFilterStore } from '@/modules/laboratory/store/laboratoryFilterStore'
import { useDeviceStore } from '../store/deviceStore'
import { routeRealtimeMessage } from './deviceRealtimeRouter'
import { useNotificationStore } from '@/modules/notification/store/notificationStore'

const MAX_RECONNECT_DELAY = 30_000

function websocketUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws/events`
}

export function startDeviceRuntime() {
  let socket: WebSocket | null = null
  let stopped = false
  let reconnectAttempt = 0
  let reconnectTimer: number | undefined

  const refreshCurrentScope = () => {
    void useDeviceStore.getState().refreshScope(
      useLaboratoryFilterStore.getState().laboratoryIds,
    )
  }

  const connect = () => {
    if (stopped || !navigator.onLine) {
      if (!stopped) useDeviceStore.getState().setRealtimeStatus('offline')
      return
    }
    useDeviceStore.getState().setRealtimeStatus(
      reconnectAttempt === 0 ? 'connecting' : 'reconnecting',
    )
    const connection = new WebSocket(websocketUrl())
    socket = connection

    connection.addEventListener('open', () => {
      if (socket !== connection || stopped) return
      reconnectAttempt = 0
      useDeviceStore.getState().setRealtimeStatus('connected')
    })
    connection.addEventListener('message', (message) => {
      if (socket !== connection || stopped) return
      routeRealtimeMessage(message.data, {
        onConnected: () => {
          refreshCurrentScope()
        },
        onDeviceEvent: (event) => {
          useDeviceStore.getState().applyRealtimeEvent(event)
        },
        onRuleExecution: (event) => {
          useNotificationStore.getState().receive(event)
        },
      })
    })
    connection.addEventListener('close', () => {
      if (socket !== connection) return
      socket = null
      if (stopped) return
      if (!navigator.onLine) {
        useDeviceStore.getState().setRealtimeStatus('offline')
        return
      }
      useDeviceStore.getState().setRealtimeStatus('reconnecting')
      const baseDelay = Math.min(1_000 * 2 ** reconnectAttempt, MAX_RECONNECT_DELAY)
      const delay = Math.round(baseDelay * (0.8 + Math.random() * 0.4))
      reconnectAttempt += 1
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = undefined
        connect()
      }, delay)
    })
    connection.addEventListener('error', () => {
      if (socket === connection) connection.close()
    })
  }

  const unsubscribeLaboratories = useLaboratoryFilterStore.subscribe((state, previous) => {
    if (state.laboratoryIds !== previous.laboratoryIds) refreshCurrentScope()
  })
  const clockTimer = window.setInterval(() => useDeviceStore.getState().tick(), 10_000)
  const handleOnline = () => {
    if (!socket && !reconnectTimer) connect()
  }
  const handleOffline = () => {
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer)
      reconnectTimer = undefined
    }
    useDeviceStore.getState().setRealtimeStatus('offline')
    socket?.close()
  }
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  refreshCurrentScope()
  connect()

  return () => {
    stopped = true
    unsubscribeLaboratories()
    window.clearInterval(clockTimer)
    if (reconnectTimer) window.clearTimeout(reconnectTimer)
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    socket?.close(1000, 'application unmounted')
    useDeviceStore.getState().setRealtimeStatus('idle')
  }
}
