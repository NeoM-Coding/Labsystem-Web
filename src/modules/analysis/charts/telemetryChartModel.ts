import type { EChartsOption } from 'echarts'
import type { TelemetryDashboard, TelemetryUsageRow } from '../types/telemetry'

export type DistributionDimension = 'laboratory' | 'organization' | 'building'
export interface UsageGroup { key: string; name: string; value: number; incomplete: boolean }
export const chartColors = ['#437f65', '#86a892', '#b7b894', '#799da4', '#ab99b5', '#c8b695']
const text = '#617365'
const format = (value: unknown) => typeof value === 'number' ? value.toLocaleString('zh-CN', { maximumFractionDigits: 2 }) : '数据不完整'
const gridLines = { lineStyle: { color: '#edf1eb', type: 'dashed' as const } }
const axisLine = { lineStyle: { color: '#e0e7dc' } }

export function aggregateUsage(rows: TelemetryUsageRow[], dimension: DistributionDimension | 'device'): UsageGroup[] {
  const groups = new Map<string, UsageGroup>()
  rows.forEach((row) => {
    const [key, name] = dimension === 'laboratory' ? [row.laboratoryId, row.laboratoryName]
      : dimension === 'organization' ? [row.orgName ?? '__unset_org__', row.orgName ?? '未设置单位']
      : dimension === 'building' ? [row.buildingName ?? '__unset_building__', row.buildingName ?? '未设置楼栋']
      : [row.deviceId, row.deviceName]
    const current = groups.get(key) ?? { key, name, value: 0, incomplete: false }
    current.value += row.value
    current.incomplete ||= row.incomplete
    groups.set(key, current)
  })
  return [...groups.values()].sort((a, b) => b.value - a.value || a.key.localeCompare(b.key))
}
export function distributionSlices(groups: UsageGroup[]): UsageGroup[] {
  const positive = groups.filter((group) => group.value > 0)
  if (positive.length <= 6) return positive
  const rest = positive.slice(5)
  return [...positive.slice(0, 5), { key: '__other__', name: '其他（' + rest.length + '项）', value: rest.reduce((sum, group) => sum + group.value, 0), incomplete: rest.some((group) => group.incomplete) }]
}
const partialPattern = { symbol: 'rect', dashArrayX: [1, 0], dashArrayY: [2, 3], rotation: -Math.PI / 4, color: 'rgba(255,255,255,.5)' }
function base(description: string): EChartsOption {
  return {
    color: chartColors,
    textStyle: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: text },
    animationDuration: 320, animationDurationUpdate: 250, animationEasing: 'cubicOut',
    aria: { enabled: true, label: { description } },
  }
}
export function trendOption(dashboard: TelemetryDashboard, type: 'bar' | 'line'): EChartsOption {
  const unit = dashboard.kind === 'AIR_CONDITION' ? 'h' : 'kWh'
  const points = dashboard.timeline
  const zoom = points.length > 32
  return {
    ...base('用量趋势，单位 ' + unit + '。斜纹或空心标记表示存在缺口或分摊；缺少有效观测的零值不连接为折线。完整数值见下方业务明细。'),
    grid: { left: 12, right: 18, top: 28, bottom: zoom ? 58 : 14, containLabel: true },
    tooltip: { trigger: 'axis', renderMode: 'richText', confine: true, valueFormatter: (value) => format(value) + (value == null ? '' : ' ' + unit), axisPointer: { type: type === 'bar' ? 'shadow' : 'line' } },
    xAxis: { type: 'category', data: points.map((p) => p.label), axisTick: { show: false }, axisLine, axisLabel: { color: text, fontSize: 11, hideOverlap: true, formatter: (value: string) => value.includes('T') ? value.split('T')[1] : value.slice(5) } },
    yAxis: { type: 'value', name: unit, nameTextStyle: { color: text, fontSize: 11 }, axisLabel: { color: text, fontSize: 11 }, splitLine: gridLines, min: 0 },
    dataZoom: zoom ? [{ type: 'slider', bottom: 0, height: 18, borderColor: '#e1e7dc', fillerColor: '#bed6c655', handleStyle: { color: '#6c977b' } }] : [],
    series: [{
      name: dashboard.kind === 'AIR_CONDITION' ? '运行时长' : '用电量',
      type, barMaxWidth: 28, barMinWidth: 2,
      data: points.map((point) => ({
        name: point.label, value: point.value === 0 && point.incomplete ? null : point.value,
        itemStyle: { color: point.incomplete ? '#aa976b' : chartColors[0], borderRadius: type === 'bar' ? [4, 4, 0, 0] : 0, ...(point.incomplete && type === 'bar' ? { decal: partialPattern } : {}) },
        symbol: point.incomplete ? 'emptyCircle' : 'circle',
      })),
      symbolSize: 6, showSymbol: points.length < 32, smooth: false, connectNulls: false,
      lineStyle: { width: 2.5 }, areaStyle: type === 'line' ? { color: '#79a58c', opacity: 0.1 } : undefined,
      emphasis: { focus: 'series' },
    }],
  }
}
export function rankingOption(groups: UsageGroup[], unit: string): EChartsOption {
  const top = groups.slice(0, 8)
  const counts = new Map<string, number>()
  top.forEach((group) => counts.set(group.name, (counts.get(group.name) ?? 0) + 1))
  const names = top.map((group) => (counts.get(group.name) ?? 0) > 1 ? group.name + ' · ' + group.key : group.name)
  return {
    ...base('设备排名，按设备汇总并降序展示前八名，单位 ' + unit + '。完整设备数值见明细表。'),
    grid: { left: 12, right: 60, top: 12, bottom: 12, containLabel: true },
    tooltip: { trigger: 'axis', renderMode: 'richText', confine: true, axisPointer: { type: 'shadow' }, valueFormatter: (value) => format(value) + ' ' + unit },
    xAxis: { type: 'value', show: false },
    yAxis: { type: 'category', data: names, inverse: true, axisTick: { show: false }, axisLine: { show: false }, axisLabel: { color: text, fontSize: 11, width: 115, overflow: 'truncate' } },
    series: [{ name: '设备用量', type: 'bar', barMaxWidth: 14, showBackground: true, backgroundStyle: { color: '#f3f6ef', borderRadius: 4 },
      data: top.map((group, index) => ({ name: names[index], value: group.value, itemStyle: { color: index === 0 ? chartColors[0] : '#91b09a', borderRadius: [0, 4, 4, 0], ...(group.incomplete ? { decal: partialPattern } : {}) } })),
      label: { show: true, position: 'right', color: '#527257', fontSize: 11, formatter: (params) => format(params.value) },
    }],
  }
}
export function distributionOption(groups: UsageGroup[], unit: string, dimensionLabel: string): EChartsOption {
  const slices = distributionSlices(groups)
  const duplicates = new Map<string, number>()
  slices.forEach((group) => duplicates.set(group.name, (duplicates.get(group.name) ?? 0) + 1))
  return {
    ...base(dimensionLabel + '用量占比，包含全部筛选记录；较小分类合并为其他。完整数据见下方明细表。'),
    tooltip: { trigger: 'item', renderMode: 'richText', confine: true, valueFormatter: (value) => format(value) + ' ' + unit },
    legend: { type: 'scroll', bottom: 0, left: 'center', selectedMode: false, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: text, fontSize: 10 }, pageIconColor: '#648669' },
    graphic: [{ type: 'text', left: 'center', top: '34%', style: { text: String(groups.filter((g) => g.value > 0).length), fill: '#385b40', fontSize: 30, fontWeight: 600 } }, { type: 'text', left: 'center', top: '47%', style: { text: dimensionLabel, fill: text, fontSize: 11 } }],
    series: [{ type: 'pie', radius: ['48%', '69%'], center: ['50%', '42%'], avoidLabelOverlap: true, minAngle: 1,
      label: { show: false }, labelLine: { show: false }, itemStyle: { borderColor: '#fff', borderWidth: 3, borderRadius: 4 },
      emphasis: { scaleSize: 4 },
      data: slices.map((group) => ({ name: (duplicates.get(group.name) ?? 0) > 1 ? group.name + ' · ' + group.key : group.name, value: group.value })),
    }],
  }
}
