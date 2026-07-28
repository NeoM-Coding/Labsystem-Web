import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useDeviceStore } from '@/modules/device/store/deviceStore'
import { useStrategyStore } from '../store/strategyStore'
import { StrategyManagement } from './StrategyManagement'

describe('StrategyManagement', () => {
  afterEach(() => {
    useStrategyStore.getState().reset()
    useDeviceStore.getState().reset()
  })

  it('uses a stable device selector snapshot', () => {
    useDeviceStore.getState().hydratePreview([{
      id: 'air-1',
      deviceName: '中央空调',
      belongTo: 'lab-1',
      deviceType: 'AirCondition',
      polling: true,
      gatewayId: 'gateway-1',
      address: 31,
      selfId: 1,
    }], [], [])
    useStrategyStore.getState().hydratePreview([])

    render(<StrategyManagement preview />)

    expect(screen.getByRole('button', { name: '新增策略' })).toBeInTheDocument()
    expect(screen.getByText('0 项策略')).toBeInTheDocument()
  })
})
