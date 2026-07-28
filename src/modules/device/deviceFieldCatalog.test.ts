import { describe, expect, it } from 'vitest'
import {
  deviceField,
  deviceFieldsFor,
  displayDeviceFieldValue,
  strategyOperatorOptions,
} from './deviceFieldCatalog'

describe('deviceFieldCatalog', () => {
  it('only exposes fields accepted by the rule engine', () => {
    expect(deviceFieldsFor('AirCondition').map((item) => item.field)).toEqual([
      'opened', 'mode', 'temperature', 'roomTemperature', 'speed',
      'errorCode', 'address', 'selfId',
    ])
    expect(deviceField('AirCondition', 'deviceId')).toBeUndefined()
  })

  it('maps enum values to Chinese without changing backend values', () => {
    expect(displayDeviceFieldValue('AirCondition', 'mode', 'Heating')).toBe('制热')
    expect(displayDeviceFieldValue('AirCondition', 'speed', 'High')).toBe('高风')
    expect(deviceField('AirCondition', 'mode')?.options?.[0].value).toBe('Cooling')
  })

  it('limits boolean and enum operators to equality comparisons', () => {
    expect(strategyOperatorOptions.boolean.map((item) => item.value)).toEqual(['EQ', 'NE'])
    expect(strategyOperatorOptions.enum.map((item) => item.value)).toEqual(['EQ', 'NE'])
    expect(strategyOperatorOptions.number.map((item) => item.value)).toContain('SE')
  })
})
