import { useState } from 'react'
import { previewDevices } from '@/modules/device/pages/devicePreviewData'
import { StrategyRevisionForm } from '../components/StrategyRevisionForm'
import type { RuntimeRevision } from '../types'

const initialRevision: RuntimeRevision = {
  runtimeId: 'workday-air-condition',
  enabled: false,
  activeFrom: null,
  activeUntil: null,
  deviceConditionGroups: [{
    groupId: '室温过高',
    conditions: [{
      conditionId: 'temperature-high',
      deviceType: 'AirCondition',
      deviceId: 'dev-air-01',
      field: 'roomTemperature',
      operator: 'GE',
      value: '28',
      logicToPrevious: 'AND',
    }],
  }],
  timeConditionGroups: [{
    groupId: '工作日晚间',
    conditions: [{
      conditionId: 'weekday-evening',
      type: 'WINDOW',
      startDate: null,
      endDate: null,
      weekdays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      zoneId: 'Asia/Shanghai',
      startTime: '18:00:00',
      endTime: '23:00:00',
      timePoint: null,
    }],
  }],
  actionGroups: [{
    actionGroupId: '打开空调',
    deviceConditionGroupId: '室温过高',
    timeConditionGroupId: '工作日晚间',
    actions: [{
      type: 'Control',
      control: {
        commandLine: 'OPEN_AIR_CONDITION_RS485',
        args: [],
        type: 'AirCondition',
        deviceId: 'dev-air-01',
      },
      userIds: [],
      reportTypes: [],
      content: null,
    }],
  }],
}

export default function StrategyRevisionFormPreviewPage() {
  const [open, setOpen] = useState(true)
  const [output, setOutput] = useState(initialRevision)
  const [valid, setValid] = useState(true)
  const [event, setEvent] = useState('正在编辑本地模拟策略')

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4 max-sm:flex-col max-sm:items-start">
        <div>
          <p className="mb-2 text-xs font-extrabold tracking-[.12em] text-[#18825c]">COMPONENT PREVIEW</p>
          <h1 className="m-0 text-3xl font-bold tracking-[-.025em]">策略动态表单</h1>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="rounded-xl bg-[#147a56] px-4 py-3 text-sm font-bold text-white active:scale-[.97]">打开动态表单</button>
      </div>
      <section className="rounded-2xl border border-[#dfe8e3] bg-white p-5 shadow-[0_8px_30px_rgb(17_48_38_/_5%)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div><p className="mb-1 text-xs font-bold text-[#71827a]">组件输出</p><h2 className="m-0 text-lg">RuntimeRevision</h2></div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${valid ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{valid ? '校验通过' : '存在错误'}</span>
        </div>
        <p className="text-xs text-[#71827a]">{event}</p>
        <pre className="max-h-[520px] overflow-auto rounded-xl bg-[#10251e] p-4 text-xs leading-5 text-[#d8f3e7]">{JSON.stringify(output, null, 2)}</pre>
      </section>
      {open && (
        <StrategyRevisionForm
          initialValue={output}
          mode="edit"
          devices={previewDevices}
          onChange={(revision, nextValid) => {
            setOutput(revision)
            setValid(nextValid)
          }}
          onCancel={() => {
            setOpen(false)
            setEvent('已取消编辑')
          }}
          onSubmit={(revision) => {
            setOutput(revision)
            setValid(true)
            setOpen(false)
            setEvent('已在本地保存表单输出')
          }}
        />
      )}
    </div>
  )
}
