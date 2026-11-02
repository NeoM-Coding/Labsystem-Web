import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getLaboratories } from '@/modules/laboratory/api/laboratories'
import { useLaboratoryFilterStore } from '@/modules/laboratory/store/laboratoryFilterStore'
import { localErrorMessage } from '@/shared/api/apiErrors'
import { downloadTimetableTemplate, importTimetables, listSemesters } from '../api/edu'
import { TimetableImportPanel, type ImportTarget } from '../components/TimetableImportPanel'
import { useEduStore } from '../store/eduStore'

export default function TimetableImportPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const semesters = useQuery({ queryKey: ['edu-import-semesters'], queryFn: () => listSemesters() })
  const laboratories = useQuery({ queryKey: ['edu-import-laboratories'], queryFn: () => getLaboratories([], []) })

  function returnToScheduling(target: ImportTarget) {
    const store = useLaboratoryFilterStore.getState()
    store.clearFilters()
    if (laboratories.data) store.setResolution(laboratories.data, false, false)
    store.setLaboratoryIds(target.laboratoryId ? [target.laboratoryId] : [])
    useEduStore.setState({ semesterStatus: 'idle' })
    navigate(`/edu/scheduling?${new URLSearchParams({ ...target })}`)
  }

  return <div>
    <div className="page-heading"><div><p className="eyebrow">EDUCATION</p><h1>Excel 课表导入</h1></div><p>选择归属，按模板整理并导入课程</p></div>
    {semesters.isPending || laboratories.isPending ? <p role="status">正在加载学期和实验室…</p>
      : semesters.isError || laboratories.isError ? <div role="alert"><p>{localErrorMessage(semesters.error ?? laboratories.error, '加载导入配置失败')}</p><button onClick={() => { void semesters.refetch(); void laboratories.refetch() }}>重试</button></div>
      : <TimetableImportPanel
        semesters={semesters.data ?? []}
        laboratories={(laboratories.data ?? []).map((lab) => ({ id: lab.id, name: lab.laboratoryName }))}
        initialSemesterId={params.get('semesterId') || semesters.data?.[0]?.id || ''}
        initialLaboratoryId={params.get('laboratoryId') ?? ''}
        onDownload={downloadTimetableTemplate}
        onImport={(file, target) => importTimetables(file, target.semesterId, target.laboratoryId)}
        onReturn={returnToScheduling}
      />}
  </div>
}
