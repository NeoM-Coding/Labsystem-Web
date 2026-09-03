import { useState } from 'react'
import { EduDashboardContent } from './EduAnalysisPage'
import type { EduDashboard, EduMetricKind } from '../types'

const previewDashboard: EduDashboard = {
  range: 'CURRENT_SEMESTER',
  periodStart: '2026-09-01',
  periodEnd: '2027-01-16',
  currentSemester: {
    id: 'semester-preview',
    name: '2026-2027学年 第一学期',
    startDate: '2026-09-01',
    endDate: '2027-01-16',
  },
  summary: {
    total: { courseCount: 126, teachingHours: 252 },
    completed: { courseCount: 42, teachingHours: 84 },
    active: { courseCount: 3, teachingHours: 6 },
    pending: { courseCount: 81, teachingHours: 162 },
    activeLaboratoryCount: 2,
  },
  timeline: Array.from({ length: 12 }, (_, index) => ({
    key: String(index + 1),
    label: `第 ${index + 1} 周`,
    metric: {
      courseCount: [6, 8, 12, 10, 14, 9, 13, 15, 8, 11, 10, 10][index],
      teachingHours: [12, 16, 24, 20, 28, 18, 26, 30, 16, 22, 20, 20][index],
    },
  })),
  weekdays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((label, index) => ({
    key: String(index + 1),
    label,
    metric: {
      courseCount: [20, 18, 22, 24, 25, 11, 6][index],
      teachingHours: [40, 36, 44, 48, 50, 22, 12][index],
    },
  })),
  sections: ['1-2节', '3-4节', '5-6节', '7-8节', '9-10节'].map((label, index) => ({
    key: label,
    label,
    metric: {
      courseCount: [18, 34, 39, 23, 12][index],
      teachingHours: [36, 68, 78, 46, 24][index],
    },
  })),
  activeCourses: [
    {
      timetableId: 'course-1',
      semesterId: 'semester-preview',
      laboratoryId: 'laboratory-1',
      laboratoryName: '16-203',
      courseName: '嵌入式系统设计',
      teacherName: '王老师',
      startAt: '2026-09-03T09:40:00',
      endAt: '2026-09-03T11:20:00',
    },
    {
      timetableId: 'course-2',
      semesterId: 'semester-preview',
      laboratoryId: 'laboratory-2',
      laboratoryName: '16-205',
      courseName: '计算机网络实验',
      teacherName: '陈老师',
      startAt: '2026-09-03T10:30:00',
      endAt: '2026-09-03T12:10:00',
    },
  ],
  calculatedAt: '2026-09-03T10:45:00',
}

export default function EduAnalysisPreviewPage() {
  const [metricKind, setMetricKind] = useState<EduMetricKind>('courseCount')

  return (
    <div className="bi-page">
      <div className="page-heading bi-page-heading">
        <div><p className="eyebrow">COMPONENT PREVIEW</p><h1>教务 BI 图表预览</h1></div>
        <p>固定数据，不调用后端；当前输出：{metricKind === 'courseCount' ? '课程数' : '学时数'}</p>
      </div>
      <div className="mb-4 flex justify-end">
        <div className="bi-segmented bi-segmented--metric" aria-label="预览统计指标">
          <button type="button" className={metricKind === 'courseCount' ? 'active' : ''} aria-pressed={metricKind === 'courseCount'} onClick={() => setMetricKind('courseCount')}>课程数</button>
          <button type="button" className={metricKind === 'teachingHours' ? 'active' : ''} aria-pressed={metricKind === 'teachingHours'} onClick={() => setMetricKind('teachingHours')}>学时数</button>
        </div>
      </div>
      <EduDashboardContent dashboard={previewDashboard} metricKind={metricKind} />
    </div>
  )
}
