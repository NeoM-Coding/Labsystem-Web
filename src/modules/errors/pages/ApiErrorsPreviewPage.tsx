import { useState } from 'react'
import { ApiError, reportApiError, useApiErrors } from '@/shared/api/apiErrors'
import { ErrorCode } from '@/shared/api/errorCodes'

const samples = [
  new ApiError(ErrorCode.MQTT_DEVICE_TIMEOUT, 504, '设备响应超时，请检查设备连接', undefined, 'preview-trace-001'),
  new ApiError(ErrorCode.PERMISSION_DENIED, 403, '无权执行此操作'),
  new ApiError(999999, 500, '未知业务码的服务端消息'),
  new ApiError(ErrorCode.VALIDATION_FAILED, 400, '请填写设备名称', { field: 'name' }, undefined, 'business', 'local'),
]
export default function ApiErrorsPreviewPage() {
  const [last, setLast] = useState<ApiError>()
  const errors = useApiErrors((state) => state.errors)
  return <main className="space-y-5 p-6"><h1 className="text-xl font-bold">API 异常处理预览</h1>
    <p>使用应用根部的真实提示组件。重复点击同一种异常只显示一条；局部接管只更新下方输出。</p>
    <div className="flex flex-wrap gap-3">{samples.map((error) => <button key={error.code} className="rounded-lg border px-4 py-2" onClick={() => { setLast(error); reportApiError(error) }}>{error.policy === 'local' ? '局部接管' : error.message}</button>)}</div>
    <p>当前提示数：{errors.length}</p><pre>{JSON.stringify(last && { code: last.code, httpStatus: last.httpStatus, message: last.message, traceId: last.traceId, data: last.data, policy: last.policy }, null, 2)}</pre>
  </main>
}
