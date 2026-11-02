import { act, cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { TelemetryChart } from './TelemetryChart'

const engine = vi.hoisted(() => ({ setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn(), init: vi.fn() }))
vi.mock('./echartsRuntime', () => ({ init: engine.init }))

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks() })

it('updates one chart instance, resizes, reacts to reduced motion and disposes on unmount', async () => {
  engine.init.mockReturnValue({ setOption: engine.setOption, resize: engine.resize, dispose: engine.dispose })
  let resized: (() => void) | undefined
  let motionChanged: (() => void) | undefined
  const disconnected = vi.fn()
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { resized = callback }
    observe = vi.fn()
    disconnect = disconnected
  })
  const preference = { matches: false, addEventListener: vi.fn((_name, callback) => { motionChanged = callback }), removeEventListener: vi.fn() }
  vi.stubGlobal('matchMedia', () => preference)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 1 })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  const view = render(<TelemetryChart label="统计图" option={{ series: [{ type: 'bar', data: [1] }] }} />)
  await waitFor(() => expect(engine.init).toHaveBeenCalledTimes(1))
  view.rerender(<TelemetryChart label="统计图" option={{ series: [{ type: 'line', data: [2] }] }} />)
  expect(engine.init).toHaveBeenCalledTimes(1)
  expect(engine.setOption.mock.lastCall?.[0].series[0].type).toBe('line')
  act(() => { resized?.() })
  expect(engine.resize).toHaveBeenCalled()
  act(() => { preference.matches = true; motionChanged?.() })
  expect(engine.setOption.mock.lastCall?.[0].animation).toBe(false)
  view.unmount()
  expect(engine.dispose).toHaveBeenCalledTimes(1)
  expect(disconnected).toHaveBeenCalled()
  expect(preference.removeEventListener).toHaveBeenCalled()
})
it('ignores a lazy import that resolves after the component is removed', async () => {
  const view = render(<TelemetryChart label="统计图" option={{}} />)
  view.unmount()
  await act(async () => { await Promise.resolve() })
  expect(engine.init).not.toHaveBeenCalled()
})
