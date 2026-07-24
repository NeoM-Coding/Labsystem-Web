import { describe, expect, it } from 'vitest'
import {
  displayTelemetryValue,
  prioritizedTelemetryEntries,
} from './telemetryPresentation'

describe('device telemetry presentation', () => {
  it.each([
    ['Access', true, '开启'],
    ['Access', false, '关闭'],
    ['AirCondition', true, '开启'],
    ['AirCondition', false, '关闭'],
    ['Light', true, '开启'],
    ['Light', false, '关闭'],
    ['CircuitBreak', true, '合闸'],
    ['CircuitBreak', false, '分闸'],
  ] as const)('renders %s opening status semantically', (deviceType, opened, expected) => {
    expect(displayTelemetryValue(deviceType, 'opened', opened)).toBe(expected)
  })

  it('puts isOpen first and keeps only the remaining highest-priority metrics', () => {
    expect(prioritizedTelemetryEntries({
      temperature: 24,
      mode: 'Cooling',
      isOpen: true,
      speed: 'Middle',
    })).toEqual([
      ['isOpen', true],
      ['temperature', 24],
      ['mode', 'Cooling'],
    ])
  })

  it('keeps sensor metrics when no opening state exists', () => {
    expect(prioritizedTelemetryEntries({
      temperature: 23,
      humidity: 48,
      co2: 612,
    })).toEqual([
      ['temperature', 23],
      ['humidity', 48],
      ['co2', 612],
    ])
  })
})
