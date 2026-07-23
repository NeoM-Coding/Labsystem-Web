import { DeviceDataCenter } from '../components/DeviceDataCenter'

export default function DeviceCenterPage() {
  return (
    <div>
      <div className="mb-7 flex items-end justify-between gap-4 max-sm:flex-col max-sm:items-start">
        <div>
          <p className="mb-2 text-xs font-extrabold tracking-[.12em] text-[#18825c]">DEVICE CENTER</p>
          <h1 className="m-0 text-3xl font-bold tracking-[-.025em]">设备数据中心</h1>
        </div>
        <p className="m-0 text-sm text-[#708079]">实时状态、遥测数据与网关信息</p>
      </div>
      <DeviceDataCenter />
    </div>
  )
}
