import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Device } from '../types'
import { DeviceControlDialog } from './DeviceControlDialog'

afterEach(cleanup)

const access: Device = {
  id: 'access-1', deviceName: '门禁', deviceType: 'Access',
  belongTo: 'lab-1', gatewayId: 'gateway-1', address: 2, polling: true,
}

describe('enhanced access control', () => {
  it.each([false, true])('submits ordered three-state enum parameters (batch=%s)', async (batch) => {
    const result = { deviceId: 'access-1', success: true, response: null, message: 'ok' }
    const single = vi.fn().mockResolvedValue(result)
    const multi = vi.fn().mockResolvedValue([result])
    render(<DeviceControlDialog open targets={batch ? [access, { ...access, id: 'access-2' }] : [access]}
      dataSource={{ single, multi }} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('radio', { name: '门禁状态控制' }))
    fireEvent.click(within(screen.getByRole('radiogroup', { name: '磁通阀' })).getByRole('radio', { name: '关闭' }))
    expect(within(screen.getByRole('radiogroup', { name: '控制面板' })).getByRole('radio', { name: '保持原状' }))
      .toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('button', { name: batch ? '发送至 2 台' : '发送指令' }))
    await waitFor(() => expect(batch ? multi : single).toHaveBeenCalledWith({
      commandLine: 'ENHANCE_CONTROL_ACCESS', type: 'Access', args: [0, 17],
      ...(batch ? { deviceIds: ['access-1', 'access-2'] } : { deviceId: 'access-1' }),
    }))
  })
})
