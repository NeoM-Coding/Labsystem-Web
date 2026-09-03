export type EduTimeRange = 'TODAY' | 'CURRENT_MONTH' | 'CURRENT_SEMESTER'

export type EduMetricKind = 'courseCount' | 'teachingHours'

export interface EduMetric {
  courseCount: number
  teachingHours: number
}

export interface EduProgressSummary {
  total: EduMetric
  completed: EduMetric
  active: EduMetric
  pending: EduMetric
  activeLaboratoryCount: number
}

export interface EduChartPoint {
  key: string
  label: string
  metric: EduMetric
}

export interface EduActiveCourse {
  timetableId: string
  semesterId: string
  laboratoryId: string
  laboratoryName: string
  courseName: string
  teacherName: string
  startAt: string
  endAt: string
}

export interface SemesterBrief {
  id: string
  name: string
  startDate: string
  endDate: string
}

export interface EduDashboard {
  range: EduTimeRange
  periodStart: string
  periodEnd: string
  currentSemester: SemesterBrief | null
  summary: EduProgressSummary
  timeline: EduChartPoint[]
  weekdays: EduChartPoint[]
  sections: EduChartPoint[]
  activeCourses: EduActiveCourse[]
  calculatedAt: string
}
