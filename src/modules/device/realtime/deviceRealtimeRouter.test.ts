import { describe, expect, it, vi } from 'vitest'
import { routeRealtimeMessage } from './deviceRealtimeRouter'

function event(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    version: '1.0',
    eventId: 'event-1',
    eventType: 'device.telemetry.updated',
    occurredAt: '2026-07-23T08:00:00.000Z',
    source: 'mqtt',
    traceId: null,
    resource: { type: 'device', id: 'device-1', laboratoryId: 'lab-1' },
    data: { deviceType: 'Sensor', temperature: 24 },
    ...overrides,
  })
}

describe('device realtime message router', () => {
  it('routes valid device telemetry to the device handler', () => {
    const onDeviceEvent = vi.fn()
    const result = routeRealtimeMessage(event(), {
      onConnected: vi.fn(),
      onDeviceEvent,
    })

    expect(result).toBe('device.event')
    expect(onDeviceEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'device.telemetry.updated',
      resource: expect.objectContaining({ id: 'device-1' }),
    }))
  })

  it('normalizes the numeric Instant format emitted by the backend', () => {
    const onDeviceEvent = vi.fn()
    const result = routeRealtimeMessage(event({
      occurredAt: 1784877756.516,
    }), {
      onConnected: vi.fn(),
      onDeviceEvent,
    })

    expect(result).toBe('device.event')
    expect(onDeviceEvent).toHaveBeenCalledWith(expect.objectContaining({
      occurredAt: '2026-07-24T07:22:36.516Z',
    }))
  })

  it('routes the server connection acknowledgement separately', () => {
    const onConnected = vi.fn()
    const result = routeRealtimeMessage(event({
      eventType: 'system.connected',
      resource: { type: 'user', id: 'user-1', laboratoryId: null },
      data: { protocolVersion: '1.0' },
    }), {
      onConnected,
      onDeviceEvent: vi.fn(),
    })

    expect(result).toBe('system.connected')
    expect(onConnected).toHaveBeenCalledOnce()
  })

  it('routes rule action group execution notices separately', () => {
    const onRuleExecution = vi.fn()
    const data = {
      eventId: 'rule-event-1',
      runtimeId: 'runtime-1',
      actionGroupId: 'group-1',
      deviceConditionGroupId: 'temperature-high',
      timeConditionGroupId: 'always',
      matchedAt: '2026-08-11T08:00:00Z',
      completedAt: '2026-08-11T08:00:01Z',
      traceId: null,
      actions: [{
        index: 0,
        type: 'Control',
        targetId: 'device-1',
        userIds: [],
        reportTypes: [],
        content: null,
        status: 'SUCCESS',
        message: 'completed',
        completedAt: '2026-08-11T08:00:01Z',
      }],
    }
    const result = routeRealtimeMessage(event({
      eventId: 'rule-event-1',
      eventType: 'rule.action-group.executed',
      source: 'rule-engine',
      resource: { type: 'runtime', id: 'runtime-1', laboratoryId: null },
      data,
    }), {
      onConnected: vi.fn(),
      onDeviceEvent: vi.fn(),
      onRuleExecution,
    })

    expect(result).toBe('rule.action-group.executed')
    expect(onRuleExecution).toHaveBeenCalledOnce()
  })

  it('rejects device events with the wrong resource route', () => {
    const onDeviceEvent = vi.fn()
    const result = routeRealtimeMessage(event({
      resource: { type: 'gateway', id: 'gateway-1', laboratoryId: 'lab-1' },
    }), {
      onConnected: vi.fn(),
      onDeviceEvent,
    })

    expect(result).toBe('invalid-message')
    expect(onDeviceEvent).not.toHaveBeenCalled()
  })

  it('ignores unsupported versions and unknown event types', () => {
    const routes = { onConnected: vi.fn(), onDeviceEvent: vi.fn() }

    expect(routeRealtimeMessage(event({ version: '2.0' }), routes))
      .toBe('unsupported-version')
    expect(routeRealtimeMessage(event({ eventType: 'gateway.updated' }), routes))
      .toBe('unknown-event')
    expect(routes.onDeviceEvent).not.toHaveBeenCalled()
  })

  it('rejects malformed JSON without invoking a route', () => {
    const routes = { onConnected: vi.fn(), onDeviceEvent: vi.fn() }

    expect(routeRealtimeMessage('{bad-json', routes)).toBe('invalid-message')
    expect(routes.onConnected).not.toHaveBeenCalled()
    expect(routes.onDeviceEvent).not.toHaveBeenCalled()
  })
})
