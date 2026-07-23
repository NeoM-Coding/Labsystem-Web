import { useEffect } from 'react'
import { LaboratoryPicker } from '../components/LaboratoryPicker'
import { useLaboratoryFilterStore } from '../store/laboratoryFilterStore'
import type { Laboratory } from '../types'

const previewLaboratories: Laboratory[] = [
  ['lab-101', '创新楼', '计算机学院', '智能系统实验室'],
  ['lab-102', '创新楼', '自动化学院', '机器人实验室'],
  ['lab-201', '工程训练中心', '计算机学院', '网络空间实验室'],
].map(([id, buildingName, orgName, laboratoryName]) => ({
  id,
  buildingName,
  orgName,
  laboratoryName,
  extra: null,
  managers: [],
  createAt: '2026-01-01T08:00:00',
  updateAt: '2026-01-01T08:00:00',
}))

export default function LaboratoryPickerPreviewPage() {
  const setResolution = useLaboratoryFilterStore((state) => state.setResolution)
  const laboratoryIds = useLaboratoryFilterStore((state) => state.laboratoryIds)

  useEffect(() => {
    setResolution(previewLaboratories, false)
  }, [setResolution])

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-extrabold tracking-[.12em] text-[#18825c]">COMPONENT PREVIEW</p>
        <h1 className="m-0 text-3xl font-bold tracking-[-.025em]">实验室 Picker</h1>
        <p className="mt-2 mb-0 text-sm text-[#708079]">
          从组合筛选命中的实验室中，决定哪些实验室参与后续业务操作。
        </p>
      </div>

      <section className="overflow-visible rounded-3xl border border-[#dfe8e3] bg-[linear-gradient(145deg,#edf6f2,#f8faf9)] py-7 shadow-[inset_0_1px_0_rgb(255_255_255_/_75%)]">
        <LaboratoryPicker />
      </section>

      <section className="rounded-2xl border border-[#e1e9e5] bg-white p-6 shadow-[0_8px_30px_rgb(17_48_38_/_5%)]">
        <p className="mb-1 text-xs font-bold text-[#71827a]">最终输出</p>
        <h2 className="mt-0 mb-4 text-lg font-bold">其他组件实际使用的 laboratoryIds</h2>
        <code className="block rounded-xl bg-[#f3f7f5] p-4 text-sm font-bold text-[#116b4b]">
          {JSON.stringify(laboratoryIds)}
        </code>
      </section>
    </div>
  )
}
