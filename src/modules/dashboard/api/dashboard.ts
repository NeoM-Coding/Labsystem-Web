import { getLaboratories } from '@/modules/laboratory/api/laboratories'
import { getDevices, getTelemetrySnapshots } from '@/modules/device/api/devices'
import { overviewTypes, type DashboardData, type OverviewType } from '../dashboardModel'

export async function getDashboard(signal?: AbortSignal): Promise<DashboardData> {
  const laboratories = await getLaboratories([], [])
  signal?.throwIfAborted()
  if (!laboratories.length) return { laboratories, devices: [], snapshots: [] }
  const ids = laboratories.map((room) => room.id)
  const [devices, snapshots] = await Promise.all([
    getDevices(ids, signal), getTelemetrySnapshots(ids, signal),
  ])
  return {
    laboratories,
    devices: devices.filter((device) => overviewTypes.includes(device.deviceType as OverviewType)),
    snapshots: snapshots.filter((snapshot) => overviewTypes.includes(snapshot.deviceType as OverviewType)),
  }
}
