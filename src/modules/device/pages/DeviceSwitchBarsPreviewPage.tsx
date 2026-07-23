import { DeviceEntitySwitchBar, DeviceTypeSwitchBar } from '../components/DeviceSwitchBars'
import { useDeviceStore } from '../store/deviceStore'

export default function DeviceSwitchBarsPreviewPage() {
  const entityMode = useDeviceStore((state) => state.entityMode)
  const deviceTypeFilter = useDeviceStore((state) => state.deviceTypeFilter)

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-extrabold tracking-[.12em] text-[#18825c]">COMPONENT PREVIEW</p>
        <h1 className="m-0 text-3xl font-bold tracking-[-.025em]">设备切换栏</h1>
      </div>
      <section className="space-y-7 rounded-3xl border border-[#dfe8e3] bg-[linear-gradient(145deg,#edf6f2,#f8faf9)] p-7">
        <div><p className="mb-2 text-xs font-bold text-[#72817b]">数据对象</p><DeviceEntitySwitchBar /></div>
        <div><p className="mb-2 text-xs font-bold text-[#72817b]">设备类型</p><DeviceTypeSwitchBar /></div>
      </section>
      <section className="rounded-2xl border border-[#e1e9e5] bg-white p-6 shadow-[0_8px_30px_rgb(17_48_38_/_5%)]">
        <p className="mb-4 text-xs font-bold text-[#71827a]">组件输出</p>
        <pre className="m-0 overflow-x-auto rounded-xl bg-[#102a22] p-4 text-sm text-[#bcf3dd]">{JSON.stringify({
          entityMode,
          deviceTypeFilter,
        }, null, 2)}</pre>
      </section>
    </div>
  )
}
