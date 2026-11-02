import { useRef, useState } from 'react'
import { localErrorMessage } from '@/shared/api/apiErrors'
import type { TimetableImportResult } from '../types'

export interface ImportOption { id: string; name: string }
export interface ImportTarget { semesterId: string; laboratoryId: string }
interface Props {
  semesters: ImportOption[]
  laboratories: ImportOption[]
  initialSemesterId?: string
  initialLaboratoryId?: string
  onImport: (file: File, target: ImportTarget) => Promise<TimetableImportResult>
  onDownload: () => Promise<void>
  onReturn: (target: ImportTarget) => void
}

export function TimetableImportPanel({ semesters, laboratories, initialSemesterId = '', initialLaboratoryId = '', onImport, onDownload, onReturn }: Props) {
  const [semesterId, setSemesterId] = useState(initialSemesterId)
  const [laboratoryId, setLaboratoryId] = useState(initialLaboratoryId)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [result, setResult] = useState<TimetableImportResult | null>(null)
  const [resultTarget, setResultTarget] = useState<ImportTarget | null>(null)
  const pending = useRef(false)
  const validTarget = semesters.some((item) => item.id === semesterId) && laboratories.some((item) => item.id === laboratoryId)
  const target = { semesterId, laboratoryId }
  const button = 'rounded-xl bg-[#147a56] px-4 py-3 text-sm font-bold text-white disabled:opacity-45'
  const input = 'mt-2 block w-full rounded-xl border border-[#d9e4df] bg-white p-3 text-sm disabled:opacity-50'

  async function submit() {
    if (!file || !validTarget || pending.current) return
    pending.current = true
    setBusy(true)
    setError(null)
    setResult(null)
    setResultTarget(null)
    try {
      setResult(await onImport(file, target))
      setResultTarget(target)
      setFile(null)
    } catch (cause) {
      setError(localErrorMessage(cause, '导入课表失败'))
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  return (
    <section className="space-y-6 rounded-3xl border border-[#d9e4df] bg-[#f8fbf9] p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label>学期<select aria-label="学期" className={input} value={semesterId} disabled={busy} onChange={(event) => setSemesterId(event.target.value)}>
          <option value="">请选择学期</option>{semesters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select></label>
        <label>实验室<select aria-label="实验室" className={input} value={laboratoryId} disabled={busy} onChange={(event) => setLaboratoryId(event.target.value)}>
          <option value="">请选择一个实验室</option>{laboratories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select></label>
      </div>
      {(!semesters.length || !laboratories.length) && <p role="status">暂无可用学期或实验室，请先创建学期并确认实验室访问权限。</p>}
      <div className="rounded-2xl bg-white p-5 text-sm leading-7">
        <h2 className="text-base font-bold">下载模板并整理课表</h2>
        <p>只填写第一张“课表数据”工作表，无表头。A～G 列依次为周一至周日，空白单元格会跳过。学期和实验室由上方配置决定。</p>
        <p>格式：课程名称&lt;&gt;时间信息&lt;&gt;教师名称。多条课程用英文逗号分隔，不合并单元格，不使用公式。</p>
        <p className="break-all font-mono">软件工程&lt;&gt;1-16周[1-2节]&lt;&gt;张三</p>
        <p>单周示例：1-8周(单)[10:00-10:45]；双周示例：2-16周(双)[18:40-20:15]。节次时间表及完整示例见模板第二张表。</p>
        <button type="button" className={button} disabled={busy || downloading} onClick={async () => {
          setDownloading(true)
          setError(null)
          try { await onDownload() } catch (cause) { setError(localErrorMessage(cause, '下载模板失败')) } finally { setDownloading(false) }
        }}>{downloading ? '正在下载…' : '下载 Excel 模板'}</button>
      </div>
      <label className="block text-sm">上传整理后的 Excel（.xlsx / .xls，最大 5 MiB）
        <input aria-label="课表 Excel" className={input} type="file" accept=".xlsx,.xls" disabled={busy} onChange={(event) => {
          const selected = event.target.files?.[0]
          setFile(null)
          setError(null)
          if (!selected) return
          if (!/\.(xlsx|xls)$/i.test(selected.name)) setError('请选择 .xlsx 或 .xls 文件')
          else if (selected.size === 0) setError('文件不能为空')
          else if (selected.size > 5 * 1024 * 1024) setError('Excel 文件不能超过 5 MiB')
          else setFile(selected)
          event.target.value = ''
        }} />
      </label>
      <p className="text-sm" aria-live="polite">目标：{semesters.find((item) => item.id === semesterId)?.name ?? '未选学期'} / {laboratories.find((item) => item.id === laboratoryId)?.name ?? '未选实验室'}；文件：{file?.name ?? '未选择'}</p>
      <p className="text-sm text-[#677870]">导入会追加课程。合法记录逐条入库；请勿重复上传已成功的课程，重试时只保留失败课程。</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-3">
        <button type="button" className={button} disabled={busy || !validTarget || !file} onClick={() => void submit()}>{busy ? '正在导入…' : '开始导入'}</button>
        <button type="button" className="rounded-xl border border-[#d9e4df] px-4 py-3 text-sm" disabled={busy} onClick={() => onReturn(resultTarget ?? target)}>返回排课</button>
      </div>
      {result && <div role="status" className="rounded-2xl bg-white p-5">
        <h2 className="font-bold">导入完成：成功 {result.ok} 条，失败 {result.fail} 条</h2>
        <p className="mt-2 text-sm">归属：{semesters.find((item) => item.id === resultTarget?.semesterId)?.name} / {laboratories.find((item) => item.id === resultTarget?.laboratoryId)?.name}</p>
        {result.errors.length > 0 && <div className="mt-4 max-h-80 space-y-3 overflow-auto">{result.errors.map((item, index) => <div key={index} className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
          <p>第 {item.rowIndex + 1} 行，第 {item.columnIndex + 1} 列：{item.reason}</p>
          <p className="mt-1 break-all">原始内容：{item.rawContent}</p>
        </div>)}</div>}
      </div>}
    </section>
  )
}
