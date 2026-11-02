import { useEffect } from 'react'
import { useApiErrors } from '@/shared/api/apiErrors'

export function ApiErrorNotifications() {
  const { errors, dismiss } = useApiErrors()
  useEffect(() => {
    if (!errors.length) return
    const timer = window.setTimeout(() => dismiss(errors[0]), 8_000)
    return () => window.clearTimeout(timer)
  }, [errors, dismiss])
  return <div className="fixed right-5 top-5 z-[200] flex max-w-sm flex-col gap-3" aria-live="polite">
    {errors.map((error) => <div key={`${error.code}:${error.message}`} role="alert" className="rounded-xl border border-red-200 bg-white p-4 text-sm text-red-800 shadow-lg">
      <div className="flex items-start gap-3"><span>{error.message}</span><button type="button" aria-label="关闭错误提示" onClick={() => dismiss(error)}>×</button></div>
      {error.traceId && <p className="mt-1 text-xs text-slate-500">追踪编号：{error.traceId}</p>}
    </div>)}
  </div>
}
