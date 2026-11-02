import { useState } from 'react'
import { TimetableImportPanel } from '../components/TimetableImportPanel'

export default function TimetableImportPreviewPage() {
  const [submission, setSubmission] = useState('尚未提交')
  const [event, setEvent] = useState('等待操作')
  return <div>
    <div className="page-heading"><div><p className="eyebrow">COMPONENT PREVIEW</p><h1>课表导入组件</h1></div><p>本地模拟：导入延迟 1 秒，固定返回部分成功；下载按钮仅展示事件</p></div>
    <TimetableImportPanel
      semesters={[{ id: 'semester-demo', name: '2026-2027 第1学期' }]}
      laboratories={[{ id: 'lab-a', name: '智能实验室 A' }, { id: 'lab-b', name: '网络实验室 B' }]}
      initialSemesterId="semester-demo"
      onDownload={async () => { setEvent('点击下载模板（预览不请求服务）') }}
      onReturn={(target) => setEvent(`返回排课：${JSON.stringify(target)}`)}
      onImport={async (file, target) => {
        setSubmission(JSON.stringify({ ...target, filename: file.name, bytes: file.size }))
        await new Promise((resolve) => window.setTimeout(resolve, 1000))
        return { ok: 2, fail: 1, errors: [{ rowIndex: 1, columnIndex: 2, rawContent: '软件工程<>1-16周[1-2节]<>张三', reason: '实验室或教师排课时间冲突' }] }
      }}
    />
    <div className="mt-4 rounded-xl border p-4 text-sm"><p>提交参数：{submission}</p><p>事件：{event}</p></div>
  </div>
}
