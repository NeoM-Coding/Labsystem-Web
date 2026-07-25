import { describe, expect, it } from 'vitest'
import {
  displayTelemetryValue,
  telemetryEntriesForDevice,
  telemetryLabelForDevice,
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

  it('uses the fixed air-condition summary contract', () => {
    expect(telemetryEntriesForDevice('AirCondition', {
      address: 31,
      roomTemperature: 25,
      temperature: 24,
      opened: true,
      speed: 'High',
      mode: 'Heating',
    })).toEqual([
      ['opened', true],
      ['mode', 'Heating'],
      ['temperature', 24],
    ])
  })

  it('places the air-condition lock state before operating details', () => {
    expect(telemetryEntriesForDevice('AirCondition', {
      opened: true,
      locked: true,
      mode: 'Heating',
      temperature: 24,
    })).toEqual([
      ['opened', true],
      ['locked', true],
      ['mode', 'Heating'],
      ['temperature', 24],
    ])
  })

  it('uses a different fixed summary order for sensors', () => {
    expect(telemetryEntriesForDevice('Sensor', {
      temperature: 23,
      humidity: 48,
      smoke: 0,
      light: 312,
    })).toEqual([
      ['smoke', 0],
      ['temperature', 23],
      ['humidity', 48],
    ])
  })

  it('puts configured detail fields first and appends unknown fields', () => {
    expect(telemetryEntriesForDevice('Light', {
      diagnostic: 7,
      selfId: 2,
      opened: true,
      address: 31,
      locked: false,
    }, 'detail')).toEqual([
      ['opened', true],
      ['locked', false],
      ['address', 31],
      ['selfId', 2],
      ['diagnostic', 7],
    ])
  })

  it('formats protocol values as user-facing values', () => {
    expect(displayTelemetryValue('AirCondition', 'mode', 'Heating')).toBe('制热')
    expect(displayTelemetryValue('AirCondition', 'mode', 'cool')).toBe('制冷')
    expect(displayTelemetryValue('AirCondition', 'mode', 'unexpected')).toBe('未知模式')
    expect(displayTelemetryValue('AirCondition', 'speed', 'High')).toBe('高风')
    expect(displayTelemetryValue('AirCondition', 'speed', 'medium')).toBe('中风')
    expect(displayTelemetryValue('AirCondition', 'speed', 'unexpected')).toBe('未知风速')
    expect(displayTelemetryValue('Access', 'delayTime', 8)).toBe('8 秒')
    expect(displayTelemetryValue('CircuitBreak', 'fixed', false)).toBe('正常')
    expect(displayTelemetryValue('AirCondition', 'errorCode', 0)).toBe('正常')
    expect(displayTelemetryValue('Light', 'locked', true)).toBe('已锁定')
  })

  it('uses device-specific Chinese labels', () => {
    expect(telemetryLabelForDevice('AirCondition', 'selfId')).toBe('内机编号')
    expect(telemetryLabelForDevice('Sensor', 'selfId')).toBe('探头编号')
    expect(telemetryLabelForDevice('Light', 'selfId')).toBe('灯具编号')
    expect(telemetryLabelForDevice('AirCondition', 'temperature')).toBe('设定温度')
    expect(telemetryLabelForDevice('AirCondition', 'roomTemperature')).toBe('室温')
    expect(telemetryLabelForDevice('AirCondition', 'errorCode')).toBe('错误码')
    expect(telemetryLabelForDevice('Access', 'address')).toBe('设备地址')
  })

  it('keeps all known sensor detail fields in their contract order', () => {
    expect(telemetryEntriesForDevice('Sensor', {
      selfId: 2,
      light: 312,
      humidity: 48,
      temperature: 23,
      smoke: 0,
      address: 31,
    }, 'detail')).toEqual([
      ['smoke', 0],
      ['temperature', 23],
      ['humidity', 48],
      ['light', 312],
      ['address', 31],
      ['selfId', 2],
    ])
  })
})
