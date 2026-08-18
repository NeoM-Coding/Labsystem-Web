export const logInputClass = 'h-10 min-w-0 rounded-xl border border-[#d9e4df] bg-white px-3 text-sm text-[#20342c] outline-none focus:border-[#48a17f] focus:shadow-[0_0_0_3px_rgb(72_161_127_/_12%)]'

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN', { hour12: false })
}

export const splitValues = (value: string | null | undefined) => value
  ? value.split(/[,，;；|]/).map((item) => item.trim()).filter(Boolean)
  : []
