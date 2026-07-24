import { describe, expect, it } from 'vitest'
import { commandsFor, initialArgs } from './commandCatalog'

describe('air-condition command catalog', () => {
  it('keeps semantic slider labels mapped to protocol values', () => {
    const command = commandsFor('AirCondition').find(
      (item) => item.commandLine === 'ENHANCE_CONTROL_AIR_CONDITION',
    )

    expect(command).toBeDefined()
    expect(initialArgs(command!)).toEqual([255, 255, 255, 255])
    expect(command!.inputs[0].options).toEqual([
      { value: 255, label: '保持不变' },
      { value: 1, label: '开启' },
      { value: 0, label: '关闭' },
    ])
    expect(command!.inputs[1].options).toEqual([
      { value: 255, label: '保持不变' },
      { value: 1, label: '制热' },
      { value: 2, label: '制冷' },
      { value: 4, label: '送风' },
      { value: 8, label: '除湿' },
    ])
    expect(command!.inputs[2].options?.at(1)).toEqual({ value: 16, label: '16°C' })
    expect(command!.inputs[2].options?.at(-1)).toEqual({ value: 30, label: '30°C' })
    expect(command!.inputs[3].options).toEqual([
      { value: 255, label: '保持不变' },
      { value: 0, label: '自动' },
      { value: 1, label: '低速' },
      { value: 2, label: '中速' },
      { value: 3, label: '高速' },
    ])
  })
})

describe('access command catalog', () => {
  it('defines the closing delay in seconds and limits it to 255 seconds', () => {
    const command = commandsFor('Access').find(
      (item) => item.commandLine === 'SET_ACCESS_DELAY',
    )

    expect(command?.inputs).toEqual([
      { name: 'delay', label: '延时时间', unit: '秒', min: 0, max: 255 },
    ])
  })
})
