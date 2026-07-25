import { create } from 'zustand'
import { getDevices, getGateways, getTelemetrySnapshots } from '../api/devices'
import type {
  Device,
  DeviceEntityMode,
  DeviceTelemetry,
  DeviceTelemetrySnapshot,
  DeviceTypeFilter,
  Gateway,
  LoadStatus,
  OnlineFilter,
  RealtimeEvent,
  RealtimeStatus,
  TelemetryRecord,
} from '../types'

const ONLINE_THRESHOLD_MS = 60_000
const SEEN_EVENT_LIMIT = 2_000
const TELEMETRY_META_FIELDS = new Set([
  'deviceId', 'deviceType', 'laboratoryId', 'origin',
  'id', 'createAt', 'updateAt', 'deleteAt',
])
const DEVICE_TYPES = new Set<Device['deviceType']>([
  'Access',
  'AirCondition',
  'Sensor',
  'CircuitBreak',
  'Light',
])

interface DeviceState {
  devicesById: Record<string, Device>
  gatewaysById: Record<string, Gateway>
  telemetryByDeviceId: Record<string, DeviceTelemetry>
  activeLaboratoryIds: string[]
  entityMode: DeviceEntityMode
  deviceTypeFilter: DeviceTypeFilter
  onlineFilter: OnlineFilter
  search: string
  selectedEntityId: string | null
  selectionMode: boolean
  selectedDeviceIds: string[]
  loadStatus: LoadStatus
  realtimeStatus: RealtimeStatus
  error: string | null
  clock: number
  setEntityMode: (mode: DeviceEntityMode) => void
  setDeviceTypeFilter: (filter: DeviceTypeFilter) => void
  setOnlineFilter: (filter: OnlineFilter) => void
  setSearch: (search: string) => void
  selectEntity: (id: string | null) => void
  enterSelectionMode: () => void
  exitSelectionMode: () => void
  toggleDeviceSelection: (id: string) => void
  selectVisibleDeviceIds: (ids: string[]) => void
  setRealtimeStatus: (status: RealtimeStatus) => void
  refreshScope: (laboratoryIds: string[]) => Promise<void>
  applyRealtimeEvent: (event: RealtimeEvent) => void
  tick: (now?: number) => void
  hydratePreview: (
    devices: Device[],
    gateways: Gateway[],
    snapshots: DeviceTelemetrySnapshot[],
  ) => void
  reset: () => void
}

let loadGeneration = 0
let activeController: AbortController | null = null
const seenEventIds = new Set<string>()
const seenEventQueue: string[] = []

function indexById<T extends { id: string }>(items: T[]) {
  return Object.fromEntries(items.map((item) => [item.id, item]))
}

function timestamp(value: string | null | undefined) {
  const parsed = value ? Date.parse(value) : Number.NaN
  return Number.isFinite(parsed) ? parsed : 0
}

function telemetryFromSnapshot(snapshot: DeviceTelemetrySnapshot): DeviceTelemetry {
  return {
    ...snapshot,
    receivedAt: new Date().toISOString(),
    onlineSignalAt: snapshot.occurredAt,
  }
}

function rememberEvent(eventId: string) {
  if (!eventId || seenEventIds.has(eventId)) return false
  seenEventIds.add(eventId)
  seenEventQueue.push(eventId)
  if (seenEventQueue.length > SEEN_EVENT_LIMIT) {
    const oldest = seenEventQueue.shift()
    if (oldest) seenEventIds.delete(oldest)
  }
  return true
}

function telemetryRecord(data: Record<string, unknown>): TelemetryRecord {
  const record: TelemetryRecord = {}
  Object.entries(data).forEach(([key, value]) => {
    if (TELEMETRY_META_FIELDS.has(key)) return
    if (
      value === null
      || typeof value === 'string'
      || typeof value === 'number'
      || typeof value === 'boolean'
    ) {
      record[key] = value
    }
  })
  return record
}

function deviceType(value: unknown): Device['deviceType'] | null {
  return typeof value === 'string' && DEVICE_TYPES.has(value as Device['deviceType'])
    ? value as Device['deviceType']
    : null
}

export function isTelemetryOnline(telemetry: DeviceTelemetry | undefined, now = Date.now()) {
  if (!telemetry) return false
  const occurredAt = timestamp(telemetry.occurredAt)
  const signalAt = timestamp(telemetry.onlineSignalAt)
  if (!telemetry.online && signalAt >= occurredAt) return false
  return now - Math.max(occurredAt, signalAt) <= ONLINE_THRESHOLD_MS
}

const initialData = {
  devicesById: {},
  gatewaysById: {},
  telemetryByDeviceId: {},
  activeLaboratoryIds: [],
  entityMode: 'device' as DeviceEntityMode,
  deviceTypeFilter: 'all' as DeviceTypeFilter,
  onlineFilter: 'all' as OnlineFilter,
  search: '',
  selectedEntityId: null,
  selectionMode: false,
  selectedDeviceIds: [],
  loadStatus: 'idle' as LoadStatus,
  realtimeStatus: 'idle' as RealtimeStatus,
  error: null,
  clock: Date.now(),
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  ...initialData,
  setEntityMode: (entityMode) => set({
    entityMode,
    selectedEntityId: null,
    selectionMode: false,
    selectedDeviceIds: [],
  }),
  setDeviceTypeFilter: (deviceTypeFilter) => set({ deviceTypeFilter }),
  setOnlineFilter: (onlineFilter) => set({ onlineFilter }),
  setSearch: (search) => set({ search }),
  selectEntity: (selectedEntityId) => set({ selectedEntityId }),
  enterSelectionMode: () => set({
    selectionMode: true,
    selectedEntityId: null,
    selectedDeviceIds: [],
  }),
  exitSelectionMode: () => set({ selectionMode: false, selectedDeviceIds: [] }),
  toggleDeviceSelection: (id) => set((state) => {
    const device = state.devicesById[id]
    if (!device) return state
    if (state.selectedDeviceIds.includes(id)) {
      return { selectedDeviceIds: state.selectedDeviceIds.filter((selectedId) => selectedId !== id) }
    }
    if (state.selectedDeviceIds.length >= 20) return state
    const selectedType = state.devicesById[state.selectedDeviceIds[0]]?.deviceType
    if (selectedType && selectedType !== device.deviceType) return state
    return { selectedDeviceIds: [...state.selectedDeviceIds, id] }
  }),
  selectVisibleDeviceIds: (ids) => set((state) => {
    const uniqueDevices = [...new Set(ids)]
      .map((id) => state.devicesById[id])
      .filter((device): device is Device => Boolean(device))
    const targetType = state.devicesById[state.selectedDeviceIds[0]]?.deviceType
      ?? uniqueDevices[0]?.deviceType
    const nextIds = uniqueDevices
      .filter((device) => device.deviceType === targetType)
      .slice(0, 20)
      .map((device) => device.id)
    return { selectedDeviceIds: nextIds }
  }),
  setRealtimeStatus: (realtimeStatus) => set({ realtimeStatus }),
  refreshScope: async (laboratoryIds) => {
    const normalizedIds = [...new Set(laboratoryIds.filter(Boolean))].sort()
    const generation = ++loadGeneration
    activeController?.abort()
    activeController = new AbortController()

    if (normalizedIds.length === 0) {
      set({
        devicesById: {},
        gatewaysById: {},
        telemetryByDeviceId: {},
        activeLaboratoryIds: [],
        selectedEntityId: null,
        selectedDeviceIds: [],
        loadStatus: 'ready',
        error: null,
      })
      return
    }

    set({ activeLaboratoryIds: normalizedIds, loadStatus: 'loading', error: null })
    try {
      const [devices, gateways, snapshots] = await Promise.all([
        getDevices(normalizedIds, activeController.signal),
        getGateways(normalizedIds, activeController.signal),
        getTelemetrySnapshots(normalizedIds, activeController.signal),
      ])
      if (generation !== loadGeneration) return

      const deviceIds = new Set(devices.map((device) => device.id))
      const previousTelemetry = get().telemetryByDeviceId
      const nextTelemetry: Record<string, DeviceTelemetry> = {}
      snapshots.forEach((snapshot) => {
        const existing = previousTelemetry[snapshot.deviceId]
        nextTelemetry[snapshot.deviceId] = existing
          && timestamp(existing.occurredAt) > timestamp(snapshot.occurredAt)
          ? existing
          : telemetryFromSnapshot(snapshot)
      })
      Object.entries(previousTelemetry).forEach(([id, telemetry]) => {
        if (deviceIds.has(id) && !nextTelemetry[id]) nextTelemetry[id] = telemetry
      })

      set({
        devicesById: indexById(devices),
        gatewaysById: indexById(gateways),
        telemetryByDeviceId: nextTelemetry,
        loadStatus: 'ready',
        error: null,
        selectedEntityId: null,
        selectedDeviceIds: get().selectedDeviceIds.filter((id) => deviceIds.has(id)),
      })
    } catch (error) {
      if (generation !== loadGeneration || (error instanceof DOMException && error.name === 'AbortError')) {
        return
      }
      set({
        loadStatus: 'error',
        error: error instanceof Error ? error.message : '设备数据加载失败',
      })
    }
  },
  applyRealtimeEvent: (event) => {
    if (
      event.version !== '1.0'
      || event.resource.type !== 'device'
      || !event.resource.laboratoryId
      || !get().activeLaboratoryIds.includes(event.resource.laboratoryId)
    ) {
      return
    }
    if (
      event.eventType !== 'device.telemetry.updated'
      && event.eventType !== 'device.online.changed'
    ) {
      return
    }
    if (!rememberEvent(event.eventId)) return

    if (event.eventType === 'device.telemetry.updated') {
      const laboratoryId = event.resource.laboratoryId
      const deviceId = event.resource.id
      const existing = get().telemetryByDeviceId[deviceId]
      if (existing && timestamp(existing.occurredAt) >= timestamp(event.occurredAt)) return
      const nextDeviceType = deviceType(event.data.deviceType)
        ?? get().devicesById[deviceId]?.deviceType
      if (!nextDeviceType) return
      set((state) => ({
        telemetryByDeviceId: {
          ...state.telemetryByDeviceId,
          [deviceId]: {
            deviceId,
            laboratoryId,
            deviceType: nextDeviceType,
            record: telemetryRecord(event.data),
            occurredAt: event.occurredAt,
            receivedAt: new Date().toISOString(),
            online: true,
            onlineSignalAt: event.occurredAt,
          },
        },
      }))
      return
    }

    if (event.eventType === 'device.online.changed') {
      const deviceId = event.resource.id
      const existing = get().telemetryByDeviceId[deviceId]
      if (!existing || timestamp(existing.onlineSignalAt) > timestamp(event.occurredAt)) return
      set((state) => ({
        telemetryByDeviceId: {
          ...state.telemetryByDeviceId,
          [deviceId]: {
            ...existing,
            online: event.data.online === true,
            onlineSignalAt: event.occurredAt,
          },
        },
      }))
    }
  },
  tick: (now = Date.now()) => set({ clock: now }),
  hydratePreview: (devices, gateways, snapshots) => set({
    devicesById: indexById(devices),
    gatewaysById: indexById(gateways),
    telemetryByDeviceId: Object.fromEntries(
      snapshots.map((snapshot) => [snapshot.deviceId, telemetryFromSnapshot(snapshot)]),
    ),
    activeLaboratoryIds: [...new Set(devices.map((device) => device.belongTo))],
    loadStatus: 'ready',
    realtimeStatus: 'connected',
    selectedEntityId: null,
    selectionMode: false,
    selectedDeviceIds: [],
    error: null,
  }),
  reset: () => {
    activeController?.abort()
    loadGeneration += 1
    seenEventIds.clear()
    seenEventQueue.length = 0
    set({ ...initialData })
  },
}))

export function selectVisibleDevices(state: DeviceState) {
  const query = state.search.trim().toLocaleLowerCase()
  return Object.values(state.devicesById).filter((device) => {
    if (state.deviceTypeFilter !== 'all' && device.deviceType !== state.deviceTypeFilter) return false
    const online = isTelemetryOnline(state.telemetryByDeviceId[device.id], state.clock)
    if (state.onlineFilter === 'online' && !online) return false
    if (state.onlineFilter === 'offline' && online) return false
    return !query
      || device.deviceName.toLocaleLowerCase().includes(query)
      || device.id.toLocaleLowerCase().includes(query)
      || String(device.address).includes(query)
  })
}

export function selectVisibleGateways(state: DeviceState) {
  const query = state.search.trim().toLocaleLowerCase()
  return Object.values(state.gatewaysById).filter((gateway) => (
    !query
    || gateway.gatewayName.toLocaleLowerCase().includes(query)
    || gateway.id.toLocaleLowerCase().includes(query)
    || gateway.sendTopic.toLocaleLowerCase().includes(query)
    || gateway.acceptTopic.toLocaleLowerCase().includes(query)
  ))
}
