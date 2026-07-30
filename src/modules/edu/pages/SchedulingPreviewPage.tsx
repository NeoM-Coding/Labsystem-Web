import { useEffect } from 'react'
import type { LaboratoryFilterDataSource } from '@/modules/laboratory/components/LaboratoryFilterBar'
import type { Laboratory } from '@/modules/laboratory/types'
import { SchedulingWorkspace } from '../components/SchedulingWorkspace'
import { useEduStore } from '../store/eduStore'
import { sectionsForTime } from '../timetableLayout'
import type { Semester, Timetable } from '../types'

const laboratories: Laboratory[] = [
  {
    id: 'lab-preview-201',
    buildingName: '创新楼',
    orgName: '计算机学院',
    laboratoryName: '16-201 智能实验室',
    extra: null,
    managers: [],
    createAt: '2026-07-01T08:00:00Z',
    updateAt: '2026-07-24T08:00:00Z',
  },
  {
    id: 'lab-preview-305',
    buildingName: '创新楼',
    orgName: '计算机学院',
    laboratoryName: '16-305 网络实验室',
    extra: null,
    managers: [],
    createAt: '2026-07-01T08:00:00Z',
    updateAt: '2026-07-24T08:00:00Z',
  },
]

const semester: Semester = {
  id: 'semester-2026-1',
  name: '2026-2027 第1学期',
  startDate: '2026-09-01',
  endDate: '2027-01-16',
  createAt: '2026-07-24T08:00:00Z',
  updateAt: '2026-07-24T08:00:00Z',
}

const course = (
  id: string,
  courseName: string,
  teacherName: string,
  laboratoryId: string,
  laboratoryName: string,
  weekday: number,
  startTime: string,
  endTime: string,
  startWeek: number,
  endWeek: number,
  weekType: Timetable['weekType'],
): Timetable => {
  const sections = sectionsForTime(startTime, endTime)
  return {
    id,
    semesterId: semester.id,
    semester,
    laboratoryId,
    laboratoryName,
    courseName,
    teacherName,
    weekday,
    ...sections,
    startTime,
    endTime,
    startWeek,
    endWeek,
    weekType,
  }
}

const timetables: Timetable[] = [
  course('course-os-a', '操作系统', '张老师', laboratories[0].id, laboratories[0].laboratoryName, 1, '08:00:00', '09:40:00', 1, 16, 'Single'),
  course('course-os-b', '计算机网络', '李教授', laboratories[0].id, laboratories[0].laboratoryName, 1, '08:00:00', '09:40:00', 1, 16, 'Double'),
  course('course-ai-a', '人工智能导论', '王老师', laboratories[1].id, laboratories[1].laboratoryName, 1, '08:00:00', '09:40:00', 1, 8, 'Both'),
  course('course-ai-b', '机器学习', '陈老师', laboratories[1].id, laboratories[1].laboratoryName, 1, '08:00:00', '09:40:00', 9, 16, 'Both'),
  course('course-db', '数据库系统', '赵老师', laboratories[0].id, laboratories[0].laboratoryName, 3, '10:00:00', '11:40:00', 1, 16, 'Both'),
  course('course-iot', '物联网工程', '周老师', laboratories[1].id, laboratories[1].laboratoryName, 5, '14:10:00', '17:40:00', 3, 14, 'Both'),
]

const dataSource: LaboratoryFilterDataSource = {
  getBuildingOptions: async () => [{ f: '创新楼', s: '创新楼' }],
  getOrganizationOptions: async () => [{ f: '计算机学院', s: '计算机学院' }],
  getLaboratories: async (buildings, organizations) => laboratories.filter((laboratory) =>
    (!buildings.length || buildings.includes(laboratory.buildingName))
    && (!organizations.length || organizations.includes(laboratory.orgName ?? '')),
  ),
}

export default function SchedulingPreviewPage() {
  const timetableCount = useEduStore((state) => Object.keys(state.timetablesById).length)
  useEffect(() => {
    useEduStore.getState().hydratePreview([semester], timetables)
  }, [])

  return (
    <div>
      <div className="page-heading">
        <div><p className="eyebrow">COMPONENT PREVIEW</p><h1>排课工作区</h1></div>
        <p>确定性数据：{timetableCount} 条课程 · 两间实验室按节次展开独立子行</p>
      </div>
      <SchedulingWorkspace
        preview
        filterDataSource={dataSource}
        filterQueryScope="edu-scheduling-preview"
        initiallySelectAllLaboratories
      />
    </div>
  )
}
