import axios from 'axios'
import { create } from 'zustand'
import { ErrorCode, errorCatalog } from './errorCodes'

export type ErrorPolicy = 'global' | 'local' | 'silent'
export type ErrorKind = 'business' | 'network' | 'timeout' | 'cancelled'
export class ApiError extends Error {
  constructor(
    public readonly code: number,
    public readonly httpStatus: number,
    message: string,
    public readonly data?: unknown,
    public readonly traceId?: string,
    public readonly kind: ErrorKind = 'business',
    public readonly policy: ErrorPolicy = 'global',
  ) { super(message); this.name = 'ApiError' }
}
function defaultMessage(code: number) {
  return (errorCatalog as Record<number, { message: string }>)[code]?.message ?? '请求失败，请稍后重试'
}
export function normalizeApiError(cause: unknown, policy: ErrorPolicy = 'global'): ApiError {
  if (cause instanceof ApiError) return cause
  if (axios.isCancel(cause)) return new ApiError(ErrorCode.REQUEST_CANCELLED, 0, defaultMessage(ErrorCode.REQUEST_CANCELLED), undefined, undefined, 'cancelled', policy)
  if (axios.isAxiosError(cause)) {
    if (!cause.response) {
      const timeout = cause.code === 'ECONNABORTED' || cause.code === 'ETIMEDOUT'
      const code = timeout ? ErrorCode.REQUEST_TIMEOUT : ErrorCode.NETWORK_ERROR
      return new ApiError(code, 0, defaultMessage(code), undefined, undefined, timeout ? 'timeout' : 'network', policy)
    }
    return errorFromResponse(cause.response.data, cause.response.status, policy)
  }
  return errorFromResponse(undefined, 0, policy)
}
export function errorFromResponse(body: unknown, status: number, policy: ErrorPolicy): ApiError {
  const value = body && typeof body === 'object' ? body as Record<string, unknown> : {}
  const httpFallbacks: Record<number, number> = {
    400: ErrorCode.VALIDATION_FAILED, 401: ErrorCode.AUTHENTICATION_REQUIRED,
    403: ErrorCode.PERMISSION_DENIED, 404: ErrorCode.RESOURCE_NOT_FOUND,
    409: ErrorCode.BUSINESS_CONFLICT, 502: ErrorCode.INVALID_RPC_RESPONSE,
    503: ErrorCode.DEPENDENCY_UNAVAILABLE, 504: ErrorCode.RPC_TIMEOUT,
  }
  const code = typeof value.code === 'number' ? value.code : httpFallbacks[status] ?? ErrorCode.INTERNAL_ERROR
  return new ApiError(code, status,
    typeof value.msg === 'string' && value.msg.trim() ? value.msg : defaultMessage(code),
    value.data, typeof value.traceId === 'string' ? value.traceId : undefined, 'business', policy)
}
interface ErrorNotifications {
  errors: ApiError[]
  report: (error: ApiError) => void
  dismiss: (error: ApiError) => void
}
export const useApiErrors = create<ErrorNotifications>((set) => ({
  errors: [],
  report: (error) => {
    if (error.policy !== 'global' || error.kind === 'cancelled') return
    set((state) => state.errors.some((item) => item.code === error.code && item.message === error.message)
      ? state : { errors: [...state.errors.slice(-4), error] })
  },
  dismiss: (error) => set((state) => ({ errors: state.errors.filter((item) => item !== error) })),
}))
/** Locally generated/preview failures use the same notification path as HTTP failures. */
export function reportApiError(error: ApiError) { useApiErrors.getState().report(error) }
export function localErrorMessage(cause: unknown, fallback: string): string {
  return cause instanceof ApiError && cause.policy !== 'local' ? '' : cause instanceof Error ? cause.message : fallback
}
