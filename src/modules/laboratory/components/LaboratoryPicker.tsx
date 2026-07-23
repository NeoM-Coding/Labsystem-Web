import { useLaboratoryFilterStore } from '../store/laboratoryFilterStore'

function LaboratoryIcon() {
  return (
    <svg
      className="size-[18px] fill-none stroke-current stroke-[1.7]"
      aria-hidden="true"
      viewBox="0 0 20 20"
    >
      <path d="M4 17h12M5.5 17V5.5h9V17M8 8h1M11 8h1M8 11h1M11 11h1M8.5 17v-3h3v3" />
    </svg>
  )
}

export function LaboratoryPicker() {
  const laboratories = useLaboratoryFilterStore((state) => state.matchedLaboratories)
  const laboratoryIds = useLaboratoryFilterStore((state) => state.laboratoryIds)
  const isResolving = useLaboratoryFilterStore((state) => state.isResolving)
  const toggleLaboratory = useLaboratoryFilterStore((state) => state.toggleLaboratory)
  const selectAll = useLaboratoryFilterStore((state) => state.selectAllLaboratories)
  const clearSelection = useLaboratoryFilterStore((state) => state.clearLaboratorySelection)

  const allSelected = laboratories.length > 0 && laboratoryIds.length === laboratories.length

  return (
    <section
      className="relative z-[9] px-8 pt-2 max-[900px]:px-[18px]"
      aria-label="选择实际使用的实验室"
    >
      <div className="rounded-[18px] border border-[#dbe6e1] bg-white/80 px-4 py-3 shadow-[0_8px_24px_rgb(24_63_49_/_5%)] backdrop-blur-xl contrast-more:border-[#61736b] contrast-more:bg-white">
        <div className="flex items-center gap-4 max-sm:items-start">
          <div className="flex min-w-[166px] items-center gap-2.5 max-sm:min-w-0 max-sm:flex-1">
            <span className="grid size-[34px] shrink-0 place-items-center rounded-[11px] bg-[#edf3f0] text-[#4c6d60]">
              <LaboratoryIcon />
            </span>
            <span className="grid gap-0.5">
              <small className="text-[11px] font-semibold tracking-[.02em] text-[#77877f]">实际使用范围</small>
              <strong className="text-sm tracking-[-.01em]">
                {isResolving ? '正在准备…' : `已选 ${laboratoryIds.length} / ${laboratories.length}`}
              </strong>
            </span>
          </div>

          <div className="flex min-w-0 flex-1 flex-wrap gap-2 max-sm:hidden">
            {!isResolving && laboratories.length === 0 && (
              <span className="py-2 text-sm text-[#7b8b84]">当前筛选没有命中的实验室</span>
            )}
            {laboratories.map((laboratory) => {
              const selected = laboratoryIds.includes(laboratory.id)
              return (
                <button
                  type="button"
                  key={laboratory.id}
                  aria-pressed={selected}
                  className={`group flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[.98] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-emerald-600/20 motion-reduce:transition-none ${
                    selected
                      ? 'border-[#8fc9b2] bg-[#eff9f5]'
                      : 'border-[#dce5e1] bg-[#fafcfb] opacity-70 hover:opacity-100'
                  }`}
                  onClick={() => toggleLaboratory(laboratory.id)}
                >
                  <span className={`grid size-[18px] place-items-center rounded-full border text-[10px] font-extrabold transition-colors ${
                    selected ? 'border-[#16805a] bg-[#16805a] text-white' : 'border-[#aebeb7] text-transparent'
                  }`}>
                    ✓
                  </span>
                  <span className="grid gap-0.5">
                    <strong className={`max-w-44 truncate text-xs ${selected ? 'text-[#145f45]' : 'text-[#52665d]'}`}>
                      {laboratory.laboratoryName}
                    </strong>
                    <small className="max-w-44 truncate text-[10px] text-[#809089]">
                      {laboratory.buildingName} · {laboratory.orgName || '未设置单位'}
                    </small>
                  </span>
                </button>
              )
            })}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            {!allSelected && laboratories.length > 0 && (
              <button
                type="button"
                className="cursor-pointer rounded-lg border-0 bg-transparent px-2.5 py-2 text-xs font-bold text-[#147a56] hover:bg-[#e8f5ef] active:scale-95 focus-visible:outline-3 focus-visible:outline-emerald-600/20"
                onClick={selectAll}
              >
                全选
              </button>
            )}
            {laboratoryIds.length > 0 && (
              <button
                type="button"
                className="cursor-pointer rounded-lg border-0 bg-transparent px-2.5 py-2 text-xs font-bold text-[#6d7d76] hover:bg-[#eef2f0] active:scale-95 focus-visible:outline-3 focus-visible:outline-emerald-600/20"
                onClick={clearSelection}
              >
                清空
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 hidden grid-cols-1 gap-2 max-sm:grid">
          {laboratories.map((laboratory) => {
            const selected = laboratoryIds.includes(laboratory.id)
            return (
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 ${
                  selected ? 'border-[#8fc9b2] bg-[#eff9f5]' : 'border-[#dce5e1] bg-[#fafcfb]'
                }`}
                key={laboratory.id}
              >
                <input
                  className="size-4 accent-[#16805a]"
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleLaboratory(laboratory.id)}
                />
                <span className="grid min-w-0 gap-0.5">
                  <strong className="truncate text-xs">{laboratory.laboratoryName}</strong>
                  <small className="truncate text-[10px] text-[#809089]">
                    {laboratory.buildingName} · {laboratory.orgName || '未设置单位'}
                  </small>
                </span>
              </label>
            )
          })}
        </div>
      </div>
    </section>
  )
}
