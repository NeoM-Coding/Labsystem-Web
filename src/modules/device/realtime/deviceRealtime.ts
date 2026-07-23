import { useLaboratoryFilterStore } from '@/modules/laboratory/store/laboratoryFilterStore'
import { useDeviceStore } from '../store/deviceStore'
import type { RealtimeEvent } from '../types'

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
    if (stopped) return
    useDeviceStore.getState().setRealtimeStatus(
      reconnectAttempt === 0 ? 'connecting' : 'reconnecting',
    )
    socket = new WebSocket(websocketUrl())

    socket.addEventListener('open', () => {
      reconnectAttempt = 0
      useDeviceStore.getState().setRealtimeStatus('connected')
    })
    socket.addEventListener('message', (message) => {
      try {
        const event = JSON.parse(String(message.data)) as RealtimeEvent
        if (event.eventType === 'system.connected') {
          refreshCurrentScope()
          return
        }
        useDeviceStore.getState().applyRealtimeEvent(event)
      } catch {
        // Invalid or unknown protocol messages are intentionally ignored.
      }
    })
    socket.addEventListener('close', () => {
      socket = null
      if (stopped) return
      useDeviceStore.getState().setRealtimeStatus(
        navigator.onLine ? 'reconnecting' : 'offline',
      )
      const baseDelay = Math.min(1_000 * 2 ** reconnectAttempt, MAX_RECONNECT_DELAY)
      const delay = Math.round(baseDelay * (0.8 + Math.random() * 0.4))
      reconnectAttempt += 1
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = undefined
        connect()
      }, delay)
    })
    socket.addEventListener('error', () => socket?.close())
  }

  const unsubscribeLaboratories = useLaboratoryFilterStore.subscribe((state, previous) => {
    if (state.laboratoryIds !== previous.laboratoryIds) refreshCurrentScope()
  })
  const clockTimer = window.setInterval(() => useDeviceStore.getState().tick(), 10_000)
  const handleOnline = () => {
    if (!socket && !reconnectTimer) connect()
  }
  const handleOffline = () => useDeviceStore.getState().setRealtimeStatus('offline')
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
