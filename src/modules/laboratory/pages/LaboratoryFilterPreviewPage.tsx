import { LaboratoryFilterBar } from '../components/LaboratoryFilterBar'
import { useLaboratoryFilterStore } from '../store/laboratoryFilterStore'
import { laboratoryFilterPreviewDataSource } from './laboratoryFilterPreviewData'

export default function LaboratoryFilterPreviewPage() {
  const buildingNames = useLaboratoryFilterStore((state) => state.buildingNames)
  const orgNames = useLaboratoryFilterStore((state) => state.orgNames)
  const laboratoryIds = useLaboratoryFilterStore((state) => state.laboratoryIds)
  const isResolving = useLaboratoryFilterStore((state) => state.isResolving)

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 max-sm:flex-col max-sm:items-start">
        <div>
          <p className="mb-2 text-xs font-extrabold tracking-[.12em] text-[#18825c]">COMPONENT PREVIEW</p>
          <h1 className="m-0 text-3xl font-bold tracking-[-.025em]">实验室组合筛选栏</h1>
        </div>
        <p className="m-0 text-sm text-[#708079]">使用本地模拟数据，可直接操作预览</p>
      </div>

      <section className="overflow-visible rounded-3xl border border-[#dfe8e3] bg-[linear-gradient(145deg,#edf6f2,#f8faf9)] py-7 shadow-[inset_0_1px_0_rgb(255_255_255_/_75%)]">
        <LaboratoryFilterBar dataSource={laboratoryFilterPreviewDataSource} queryScope="preview" />
      </section>

      <section className="rounded-2xl border border-[#e1e9e5] bg-white p-6 shadow-[0_8px_30px_rgb(17_48_38_/_5%)]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-bold text-[#71827a]">组件输出</p>
            <h2 className="m-0 text-lg font-bold">其他组件收到的筛选状态</h2>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${
            isResolving ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
          }`}>
            {isResolving ? '正在解析' : '可以使用'}
          </span>
        </div>

        <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 text-sm max-sm:grid-cols-1 max-sm:gap-y-1">
          <dt className="font-semibold text-[#71827a]">buildingNames</dt>
          <dd className="m-0 break-all font-mono text-[#263a32]">
            {JSON.stringify(buildingNames)}
          </dd>
          <dt className="font-semibold text-[#71827a]">orgNames</dt>
          <dd className="m-0 break-all font-mono text-[#263a32]">
            {JSON.stringify(orgNames)}
          </dd>
          <dt className="font-semibold text-[#71827a]">laboratoryIds</dt>
          <dd className="m-0 break-all font-mono font-bold text-[#116b4b]">
            {JSON.stringify(laboratoryIds)}
          </dd>
        </dl>
      </section>
    </div>
  )
}
