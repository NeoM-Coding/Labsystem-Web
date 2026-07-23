import type { DeviceType } from '../types'
import type { DeviceCommandSpec } from './types'

const keep = { value: 255, label: '保持不变' }

const commands: Record<DeviceType, DeviceCommandSpec[]> = {
  Access: [
    { commandLine: 'OPEN_ACCESS_ONCE', label: '单次开门', description: '立即打开门禁一次。', tone: 'normal', inputs: [] },
    { commandLine: 'CLOSE_ACCESS_ONCE', label: '单次关门', description: '立即关闭门禁一次。', tone: 'caution', inputs: [] },
    {
      commandLine: 'SET_ACCESS_DELAY',
      label: '设置关门延时',
      description: '设置门禁自动关门前的等待时间。',
      tone: 'normal',
      inputs: [{ name: 'delay', label: '延时时间', help: '协议字节值，范围 0–255。', min: 0, max: 255 }],
    },
    { commandLine: 'REQUEST_ACCESS_DATA', label: '刷新门禁状态', description: '主动请求一次门禁当前状态。', tone: 'normal', inputs: [] },
  ],
  AirCondition: [
    { commandLine: 'OPEN_AIR_CONDITION_RS485', label: '打开空调', description: '保持其他参数不变并开启空调。', tone: 'normal', inputs: [] },
    { commandLine: 'CLOSE_AIR_CONDITION_RS485', label: '关闭空调', description: '关闭目标空调。', tone: 'caution', inputs: [] },
    {
      commandLine: 'ENHANCE_CONTROL_AIR_CONDITION',
      label: '增强控制',
      description: '一次调整开关、模式、温度和风速；保持不变会发送 255。',
      tone: 'normal',
      inputs: [
        { name: 'opened', label: '运行状态', help: '选择保持不变时不会修改此字段。', options: [keep, { value: 1, label: '开启' }, { value: 0, label: '关闭' }] },
        { name: 'mode', label: '运行模式', help: '协议值：制热 1、制冷 2、送风 4、除湿 8。', options: [keep, { value: 1, label: '制热' }, { value: 2, label: '制冷' }, { value: 4, label: '送风' }, { value: 8, label: '除湿' }] },
        { name: 'temperature', label: '设定温度', help: '限制为常见的 16–30°C。', options: [keep, ...Array.from({ length: 15 }, (_, index) => ({ value: index + 16, label: `${index + 16}°C` }))] },
        { name: 'speed', label: '风速', help: '协议值：自动 0、低 1、中 2、高 3。', options: [keep, { value: 0, label: '自动' }, { value: 1, label: '低速' }, { value: 2, label: '中速' }, { value: 3, label: '高速' }] },
      ],
    },
    { commandLine: 'REQUEST_AIR_CONDITION_DATA_RS485', label: '刷新空调状态', description: '主动请求一次空调当前状态。', tone: 'normal', inputs: [] },
  ],
  CircuitBreak: [
    { commandLine: 'OPEN_CIRCUITBREAK', label: '断路器合闸', description: '闭合断路器回路。', tone: 'caution', inputs: [] },
    { commandLine: 'CLOSE_CIRCUITBREAK', label: '断路器分闸', description: '断开断路器回路。', tone: 'caution', inputs: [] },
    { commandLine: 'REQUEST_CIRCUITBREAK_DATA', label: '刷新断路器状态', description: '主动请求一次断路器当前状态。', tone: 'normal', inputs: [] },
  ],
  Light: [
    { commandLine: 'OPEN_LIGHT', label: '打开照明', description: '打开目标照明设备。', tone: 'normal', inputs: [] },
    { commandLine: 'CLOSE_LIGHT', label: '关闭照明', description: '关闭目标照明设备。', tone: 'caution', inputs: [] },
    { commandLine: 'LOCK_LIGHT', label: '锁定照明控制', description: '锁定设备的本地控制状态。', tone: 'caution', inputs: [] },
    { commandLine: 'UNLOCK_LIGHT', label: '解除照明锁定', description: '恢复设备的本地控制能力。', tone: 'normal', inputs: [] },
    { commandLine: 'REQUEST_LIGHT_DATA', label: '刷新照明状态', description: '主动请求一次照明当前状态。', tone: 'normal', inputs: [] },
  ],
  Sensor: [
    { commandLine: 'REQUEST_SENSOR_DATA', label: '刷新传感器状态', description: '传感器是只读设备，可主动请求一次当前数据。', tone: 'normal', inputs: [] },
  ],
}

export function commandsFor(deviceType: DeviceType) {
  return commands[deviceType]
}

export function initialArgs(spec: DeviceCommandSpec) {
  return spec.inputs.map((input) => input.options ? input.options[0].value : input.min ?? 0)
}
