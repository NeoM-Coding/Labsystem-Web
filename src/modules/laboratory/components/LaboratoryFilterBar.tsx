import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  getBuildingOptions,
  getLaboratories,
  getOrganizationOptions,
} from '../api/laboratories'
import { useLaboratoryFilterStore } from '../store/laboratoryFilterStore'
import type { Laboratory, OptionPair } from '../types'

interface SelectOption {
  value: string
  label: string
  description?: string
}

interface MultiSelectMenuProps {
  label: string
  values: string[]
  options: SelectOption[]
  isLoading: boolean
  onChange: (values: string[]) => void
  emptySummary?: string
}

export interface LaboratoryFilterDataSource {
  getBuildingOptions: () => Promise<OptionPair[]>
  getOrganizationOptions: () => Promise<OptionPair[]>
  getLaboratories: (buildingNames: string[], orgNames: string[]) => ReturnType<typeof getLaboratories>
}

interface LaboratoryFilterBarProps {
  dataSource?: LaboratoryFilterDataSource
  queryScope?: string
  embedded?: boolean
  selectAllOnResolve?: boolean
  selectFirstOnResolve?: boolean
}

const defaultDataSource: LaboratoryFilterDataSource = {
  getBuildingOptions,
  getOrganizationOptions,
  getLaboratories,
}

function ChevronIcon() {
  return (
    <svg
      className="size-[18px] shrink-0 fill-none stroke-[#64766e] stroke-[1.8] transition-transform duration-200 group-aria-expanded:rotate-180 motion-reduce:transition-none"
      aria-hidden="true"
      viewBox="0 0 20 20"
    >
      <path d="m6.5 8 3.5 3.5L13.5 8" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg
      className="size-[18px] fill-none stroke-current stroke-[1.7]"
      aria-hidden="true"
      viewBox="0 0 20 20"
    >
      <path d="M3 5h14M5.5 10h9M8 15h4" />
    </svg>
  )
}

function MultiSelectMenu({
  label,
  values,
  options,
  isLoading,
  onChange,
  emptySummary,
}: MultiSelectMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!isOpen) return

    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePress)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePress)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  const toggle = (value: string) => {
    onChange(
      values.includes(value)
        ? values.filter((current) => current !== value)
        : [...values, value],
    )
  }

  const selectedLabel = options.find((option) => option.value === values[0])?.label
  const selectedNames = values
    .map((value) => options.find((option) => option.value === value)?.label ?? value)
    .join('、')
  const summary = values.length === 0
    ? emptySummary ?? `全部${label}`
    : values.length === 1
      ? selectedLabel ?? values[0]
      : selectedNames

  return (
    <div
      className="relative min-w-0 w-full"
      ref={rootRef}
    >
      <button
        type="button"
        className={`group flex min-h-[54px] w-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-[13px] py-[7px] pr-[10px] text-left transition-[border-color,background-color,box-shadow,transform] duration-150 ease-out active:scale-[.98] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-emerald-600/20 motion-reduce:transition-none ${
          values.length
            ? 'border-[#8fc9b2] bg-[#f0faf6]'
            : 'border-[#dce6e1] bg-[#f8fbf9]/90 hover:border-[#b9d4c8] hover:bg-white'
        }`}
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="grid min-w-0 gap-0.5">
          <small className="text-[11px] font-semibold tracking-[.02em] text-[#77877f]">{label}</small>
          <strong className={`block w-full truncate text-[13px] font-semibold ${values.length ? 'text-[#116b4b]' : 'text-[#243a32]'}`}>
            {summary}
          </strong>
        </span>
        <span className="grid shrink-0 justify-items-center gap-0.5">
          <span
            className={`grid h-[18px] min-w-[18px] place-items-center rounded-full border px-1 text-[10px] font-extrabold tabular-nums transition-[border-color,background-color,color] duration-150 motion-reduce:transition-none ${
              values.length > 0
                ? 'border-[#8fc9b2] bg-[#dff3eb] text-[#116b4b]'
                : 'border-[#d4dfda] bg-white/75 text-[#7b8a84]'
            }`}
            aria-label={`已选 ${values.length} 项`}
          >
            {values.length}
          </span>
          <ChevronIcon />
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[min(240px,calc(100vw-36px))] max-w-[min(360px,calc(100vw-36px))] origin-top-left overflow-hidden rounded-[15px] border border-[#cddcd5]/90 bg-white/92 shadow-[0_18px_46px_rgb(16_52_40_/_16%)] backdrop-blur-2xl backdrop-saturate-150 transition duration-200 ease-out starting:-translate-y-1 starting:scale-[.98] starting:opacity-0 max-sm:relative max-sm:top-[5px] max-sm:mb-[5px] max-sm:w-full max-sm:max-w-none max-sm:shadow-[0_10px_28px_rgb(16_52_40_/_12%)] motion-reduce:transform-none motion-reduce:transition-none contrast-more:border-[#61736b] contrast-more:bg-white"
          id={menuId}
        >
          <div className="flex items-center justify-between px-[13px] pt-3 pb-[9px] text-xs font-bold text-[#6c7d75]">
            <span>选择{label}</span>
            {values.length > 0 && (
              <button
                className="cursor-pointer border-0 bg-transparent px-[5px] py-1 text-xs text-[#147a56] focus-visible:outline-3 focus-visible:outline-emerald-600/20"
                type="button"
                onClick={() => onChange([])}
              >
                清除
              </button>
            )}
          </div>
          <div className="max-h-[260px] overflow-y-auto px-[7px] pt-[3px] pb-2">
            {isLoading ? (
              <div className="px-[10px] py-[18px] text-center text-[13px] text-[#84928c]">正在加载选项…</div>
            ) : options.length === 0 ? (
              <div className="px-[10px] py-[18px] text-center text-[13px] text-[#84928c]">暂无可用选项</div>
            ) : options.map((option) => {
              const checked = values.includes(option.value)
              return (
                <label
                  className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-[9px] px-2 py-[7px] text-[13px] text-[#293b34] transition-[background-color,transform] duration-100 ease-out hover:bg-[#edf7f3] active:scale-[.985] has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-emerald-600/20 motion-reduce:transition-none"
                  key={option.value}
                >
                  <input
                    className="pointer-events-none absolute size-px opacity-0"
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(option.value)}
                  />
                  <span
                    className={`grid size-[19px] shrink-0 place-items-center rounded-md border-[1.5px] text-xs font-extrabold text-white transition-[background-color,border-color,transform] duration-150 motion-reduce:transition-none ${
                      checked ? 'scale-[1.04] border-[#16805a] bg-[#16805a]' : 'border-[#b7c9c1]'
                    }`}
                    aria-hidden="true"
                  >
                    {checked && '✓'}
                  </span>
                  <span className="grid min-w-0 gap-0.5">
                    <span className="truncate">{option.label}</span>
                    {option.description && (
                      <small className="truncate text-[10px] font-normal text-[#819089]">
                        {option.description}
                      </small>
                    )}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function uniqueOptionNames(options: OptionPair[] | undefined) {
  return [...new Set(
    (options ?? [])
      .map((option) => option.s?.trim())
      .filter((name): name is string => Boolean(name)),
  )]
}

function namedOptions(names: string[]): SelectOption[] {
  return names.map((name) => ({ value: name, label: name }))
}

function laboratoryOptions(laboratories: Laboratory[] | undefined): SelectOption[] {
  return (laboratories ?? []).map((laboratory) => ({
    value: laboratory.id,
    label: laboratory.laboratoryName,
    description: `${laboratory.buildingName} · ${laboratory.orgName || '未设置单位'}`,
  }))
}

export function LaboratoryFilterBar({
  dataSource = defaultDataSource,
  queryScope = 'application',
  embedded = false,
  selectAllOnResolve = true,
  selectFirstOnResolve = false,
}: LaboratoryFilterBarProps = {}) {
  const buildingNames = useLaboratoryFilterStore((state) => state.buildingNames)
  const orgNames = useLaboratoryFilterStore((state) => state.orgNames)
  const laboratoryIds = useLaboratoryFilterStore((state) => state.laboratoryIds)
  const setBuildingNames = useLaboratoryFilterStore((state) => state.setBuildingNames)
  const setOrgNames = useLaboratoryFilterStore((state) => state.setOrgNames)
  const setLaboratoryIds = useLaboratoryFilterStore((state) => state.setLaboratoryIds)
  const setResolution = useLaboratoryFilterStore((state) => state.setResolution)
  const clearFilters = useLaboratoryFilterStore((state) => state.clearFilters)
  const defaultedBuildings = useRef(false)
  const defaultedOrganizations = useRef(false)
  const defaultedLaboratory = useRef(false)

  const buildingsQuery = useQuery({
    queryKey: ['laboratory-options', queryScope, 'buildings'],
    queryFn: dataSource.getBuildingOptions,
    staleTime: 5 * 60 * 1000,
  })
  const organizationsQuery = useQuery({
    queryKey: ['laboratory-options', queryScope, 'organizations'],
    queryFn: dataSource.getOrganizationOptions,
    staleTime: 5 * 60 * 1000,
  })
  const laboratoriesQuery = useQuery({
    queryKey: ['laboratories', queryScope, { buildingNames, orgNames }],
    queryFn: () => dataSource.getLaboratories(buildingNames, orgNames),
    placeholderData: keepPreviousData,
  })

  const buildingOptions = useMemo(
    () => uniqueOptionNames(buildingsQuery.data),
    [buildingsQuery.data],
  )
  const organizationOptions = useMemo(
    () => uniqueOptionNames(organizationsQuery.data),
    [organizationsQuery.data],
  )
  const isResolving = laboratoriesQuery.isPending || laboratoriesQuery.isFetching
  const availableLaboratories = useMemo(
    () => laboratoriesQuery.data ?? [],
    [laboratoriesQuery.data],
  )
  const selectedCount = laboratoryIds.length
  const matchedCount = laboratoriesQuery.data?.length ?? 0
  const allLaboratoriesSelected = matchedCount > 0 && selectedCount === matchedCount
  const hasFilters = buildingNames.length > 0
    || orgNames.length > 0
    || !allLaboratoriesSelected

  useEffect(() => {
    setResolution(
      laboratoriesQuery.data ?? [],
      isResolving,
      selectAllOnResolve,
    )
  }, [isResolving, laboratoriesQuery.data, selectAllOnResolve, setResolution])

  useEffect(() => {
    if (!selectFirstOnResolve || defaultedBuildings.current || buildingOptions.length === 0) return
    defaultedBuildings.current = true
    if (buildingNames.length === 0) setBuildingNames([buildingOptions[0]])
  }, [buildingNames.length, buildingOptions, selectFirstOnResolve, setBuildingNames])

  useEffect(() => {
    if (!selectFirstOnResolve || defaultedOrganizations.current || organizationOptions.length === 0) return
    defaultedOrganizations.current = true
    if (orgNames.length === 0) setOrgNames([organizationOptions[0]])
  }, [orgNames.length, organizationOptions, selectFirstOnResolve, setOrgNames])

  useEffect(() => {
    if (!selectFirstOnResolve || defaultedLaboratory.current || isResolving || availableLaboratories.length === 0) return
    defaultedLaboratory.current = true
    if (laboratoryIds.length === 0) setLaboratoryIds([availableLaboratories[0].id])
  }, [availableLaboratories, isResolving, laboratoryIds.length, selectFirstOnResolve, setLaboratoryIds])

  return (
    <section
      className={`relative z-10 ${embedded ? '' : 'px-8 pt-3.5 max-[900px]:px-[18px]'}`}
      aria-label="实验室组合筛选"
    >
      <div className="flex min-h-[68px] items-center gap-[18px] rounded-[18px] border border-[#ccdbd4]/80 bg-white/78 px-3 py-2.5 shadow-[0_12px_32px_rgb(24_63_49_/_7%)] backdrop-blur-[20px] backdrop-saturate-150 max-[1180px]:flex-wrap max-[1180px]:items-stretch max-[1180px]:gap-2.5 contrast-more:border-[#61736b] contrast-more:bg-white">
        <div className="flex shrink-0 items-center gap-2.5 py-0 pr-2 pl-0.5 max-[1180px]:flex-1">
          <span className="grid size-[34px] place-items-center rounded-[11px] bg-[#e4f5ee] text-[#147a56]">
            <FilterIcon />
          </span>
          <span className="grid gap-0.5 whitespace-nowrap">
            <small className="text-[11px] font-semibold tracking-[.02em] text-[#77877f]">当前作用范围</small>
            <strong className="text-sm tracking-[-.01em]">实验室筛选</strong>
          </span>
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-3 items-center gap-2 max-[1180px]:order-3 max-[1180px]:basis-full max-[700px]:grid-cols-1">
          <MultiSelectMenu
            label="楼栋"
            values={buildingNames}
            options={namedOptions(buildingOptions)}
            isLoading={buildingsQuery.isPending}
            onChange={setBuildingNames}
          />
          <MultiSelectMenu
            label="所属单位"
            values={orgNames}
            options={namedOptions(organizationOptions)}
            isLoading={organizationsQuery.isPending}
            onChange={setOrgNames}
          />
          <MultiSelectMenu
            label="实验室"
            values={laboratoryIds}
            options={laboratoryOptions(availableLaboratories)}
            isLoading={isResolving}
            onChange={setLaboratoryIds}
            emptySummary="未选择实验室"
          />
        </div>

        <div
          className="flex shrink-0 items-center justify-end gap-2 whitespace-nowrap text-xs text-[#667870] tabular-nums max-[1180px]:ml-auto"
          aria-live="polite"
        >
          {laboratoriesQuery.isError ? (
            <span className="text-[#b44a4a]">筛选加载失败</span>
          ) : (
            <span>
              {isResolving
                ? '正在匹配…'
                : `已选 ${selectedCount} / ${matchedCount} 间`}
            </span>
          )}
          {hasFilters && (
            <button
              type="button"
              className="cursor-pointer rounded-[9px] border-0 bg-transparent px-[9px] py-[7px] text-xs font-bold text-[#147a56] transition-[background-color,transform] duration-150 hover:bg-[#e8f5ef] active:scale-95 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-emerald-600/20 motion-reduce:transition-none"
              onClick={clearFilters}
            >
              重置
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
