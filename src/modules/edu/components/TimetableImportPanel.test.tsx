import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TimetableImportPanel } from './TimetableImportPanel'
import type { TimetableImportResult } from '../types'

afterEach(cleanup)
const options = { semesters: [{ id: 's1', name: '测试学期' }], laboratories: [{ id: 'l1', name: '测试实验室' }] }
const file = new File(['excel'], '课表.xlsx')
const chooseFile = (selected: File) => fireEvent.change(screen.getByLabelText('课表 Excel'), { target: { files: [selected] } })

describe('TimetableImportPanel', () => {
  it('requires a valid target and file, rejects invalid/empty/oversized files', () => {
    render(<TimetableImportPanel {...options} onImport={vi.fn()} onDownload={vi.fn()} onReturn={vi.fn()} />)
    chooseFile(file)
    expect(screen.getByText('开始导入')).toBeDisabled()
    fireEvent.change(screen.getByLabelText('学期'), { target: { value: 's1' } })
    fireEvent.change(screen.getByLabelText('实验室'), { target: { value: 'l1' } })
    expect(screen.getByText('开始导入')).toBeEnabled()
    chooseFile(new File(['data'], '课表.csv'))
    expect(screen.getByRole('alert')).toHaveTextContent('请选择 .xlsx 或 .xls 文件')
    expect(screen.getByText('开始导入')).toBeDisabled()
    chooseFile(new File([], '课表.xls'))
    expect(screen.getByRole('alert')).toHaveTextContent('文件不能为空')
    chooseFile(new File([new Uint8Array(5 * 1024 * 1024 + 1)], '课表.xlsx'))
    expect(screen.getByRole('alert')).toHaveTextContent('不能超过 5 MiB')
  })

  it('locks submission, shows partial failures and returns to the original imported target', async () => {
    let finish!: (value: TimetableImportResult) => void
    const onImport = vi.fn(() => new Promise<TimetableImportResult>((resolve) => { finish = resolve }))
    const onReturn = vi.fn()
    render(<TimetableImportPanel {...options} initialSemesterId="s1" initialLaboratoryId="l1" onImport={onImport} onDownload={vi.fn()} onReturn={onReturn} />)
    chooseFile(file)
    fireEvent.click(screen.getByText('开始导入'))
    expect(screen.getByLabelText('学期')).toBeDisabled()
    expect(screen.getByLabelText('实验室')).toBeDisabled()
    expect(screen.getByText('正在导入…')).toBeDisabled()
    fireEvent.click(screen.getByText('正在导入…'))
    expect(onImport).toHaveBeenCalledTimes(1)
    expect(onImport).toHaveBeenCalledWith(file, { semesterId: 's1', laboratoryId: 'l1' })
    await act(async () => finish({ ok: 2, fail: 1, errors: [{ rowIndex: 1, columnIndex: 2, rawContent: '错误课程', reason: '排课冲突' }] }))
    expect(screen.getByText('导入完成：成功 2 条，失败 1 条')).toBeInTheDocument()
    expect(screen.getByText('第 2 行，第 3 列：排课冲突')).toBeInTheDocument()
    expect(screen.getByText('原始内容：错误课程')).toBeInTheDocument()
    expect(screen.getByText('开始导入')).toBeDisabled()
    fireEvent.change(screen.getByLabelText('实验室'), { target: { value: '' } })
    fireEvent.click(screen.getByText('返回排课'))
    expect(onReturn).toHaveBeenCalledWith({ semesterId: 's1', laboratoryId: 'l1' })
  })

  it('reports download and import failures and lets the user retry', async () => {
    const onImport = vi.fn().mockRejectedValue(new Error('导入暂时失败'))
    render(<TimetableImportPanel {...options} initialSemesterId="s1" initialLaboratoryId="l1" onImport={onImport} onDownload={vi.fn().mockRejectedValue(new Error('下载暂时失败'))} onReturn={vi.fn()} />)
    fireEvent.click(screen.getByText('下载 Excel 模板'))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    chooseFile(file)
    fireEvent.click(screen.getByText('开始导入'))
    await waitFor(() => expect(screen.getByText('开始导入')).toBeEnabled())
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
