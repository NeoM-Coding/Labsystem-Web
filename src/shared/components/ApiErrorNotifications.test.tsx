import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ApiErrorNotifications } from './ApiErrorNotifications'
import ApiErrorsPreviewPage from '@/modules/errors/pages/ApiErrorsPreviewPage'
import { useApiErrors } from '@/shared/api/apiErrors'

describe('API error preview with the real notification component', () => {
  beforeEach(() => useApiErrors.setState({ errors: [] }))
  it('shows, deduplicates, dismisses and locally handles deterministic failures', () => {
    render(<><ApiErrorNotifications /><ApiErrorsPreviewPage /></>)
    const timeout = screen.getByRole('button', { name: '设备响应超时，请检查设备连接' })
    fireEvent.click(timeout)
    fireEvent.click(timeout)
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(screen.getByText('追踪编号：preview-trace-001')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '关闭错误提示' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '局部接管' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText(/"policy": "local"/)).toBeInTheDocument()
  })
})
