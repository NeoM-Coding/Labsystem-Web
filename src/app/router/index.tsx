import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/app/layouts/AppLayout'
import { PageLoader } from '@/shared/components/PageLoader'
import {
  GuestOnlyRoute,
  RequireSession,
} from '@/modules/auth/components/SessionRoutes'

const ApiErrorsPreviewPage = lazy(() => import('@/modules/errors/pages/ApiErrorsPreviewPage'))
const DashboardPreviewPage = lazy(() => import('@/modules/dashboard/pages/DashboardPreviewPage'))
const DashboardPage = lazy(() => import('@/modules/dashboard/pages/DashboardPage'))
const LoginPage = lazy(() => import('@/modules/auth/pages/LoginPage'))
const NotFoundPage = lazy(() => import('@/modules/errors/pages/NotFoundPage'))
const LaboratoryFilterPreviewPage = lazy(
  () => import('@/modules/laboratory/pages/LaboratoryFilterPreviewPage'),
)
const DeviceCenterPage = lazy(() => import('@/modules/device/pages/DeviceCenterPage'))
const DeviceManagementPage = lazy(() => import('@/modules/device/pages/DeviceManagementPage'))
const DeviceSwitchBarsPreviewPage = lazy(
  () => import('@/modules/device/pages/DeviceSwitchBarsPreviewPage'),
)
const DeviceDataCenterPreviewPage = lazy(
  () => import('@/modules/device/pages/DeviceDataCenterPreviewPage'),
)
const DeviceControlPreviewPage = lazy(
  () => import('@/modules/device/pages/DeviceControlPreviewPage'),
)
const DeviceManagementPreviewPage = lazy(
  () => import('@/modules/device/pages/DeviceManagementPreviewPage'),
)
const LaboratoryManagementPage = lazy(
  () => import('@/modules/laboratory/pages/LaboratoryManagementPage'),
)
const LaboratoryManagementPreviewPage = lazy(
  () => import('@/modules/laboratory/pages/LaboratoryManagementPreviewPage'),
)
const AccountManagementPage = lazy(
  () => import('@/modules/account/pages/AccountManagementPage'),
)
const AccountManagementPreviewPage = lazy(
  () => import('@/modules/account/pages/AccountManagementPreviewPage'),
)
const StrategyManagementPage = lazy(
  () => import('@/modules/strategy/pages/StrategyManagementPage'),
)
const StrategyManagementPreviewPage = lazy(
  () => import('@/modules/strategy/pages/StrategyManagementPreviewPage'),
)
const StrategyRevisionFormPreviewPage = lazy(
  () => import('@/modules/strategy/pages/StrategyRevisionFormPreviewPage'),
)
const TimetableImportPage = lazy(() => import("@/modules/edu/pages/TimetableImportPage"))
const TimetableImportPreviewPage = lazy(() => import("@/modules/edu/pages/TimetableImportPreviewPage"))
const SchedulingPage = lazy(() => import('@/modules/edu/pages/SchedulingPage'))
const SchedulingPreviewPage = lazy(() => import('@/modules/edu/pages/SchedulingPreviewPage'))
const NotificationCenterPreviewPage = lazy(
  () => import('@/modules/notification/pages/NotificationCenterPreviewPage'),
)
const AuditLogPage = lazy(() => import('@/modules/log/pages/AuditLogPage'))
const AlertLogPage = lazy(() => import('@/modules/log/pages/AlertLogPage'))
const LogCenterPreviewPage = lazy(() => import('@/modules/log/pages/LogCenterPreviewPage'))
const EduAnalysisPage = lazy(() => import('@/modules/analysis/pages/EduAnalysisPage'))
const AirConditionAnalysisPage = lazy(
  () => import('@/modules/analysis/pages/AirConditionAnalysisPage'),
)
const EnergyAnalysisPage = lazy(
  () => import('@/modules/analysis/pages/EnergyAnalysisPage'),
)
const TelemetryAnalysisPreviewPage = lazy(() => import('@/modules/analysis/pages/TelemetryAnalysisPreviewPage'))
const EduAnalysisPreviewPage = lazy(
  () => import('@/modules/analysis/pages/EduAnalysisPreviewPage'),
)

const render = (element: React.ReactNode) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
)

export const router = createBrowserRouter([
  {
    element: <GuestOnlyRoute />,
    children: [
      { path: '/login', element: render(<LoginPage />) },
    ],
  },
  {
    element: <RequireSession />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: render(<DashboardPage />) },
          { path: 'previews/api-errors', element: render(<ApiErrorsPreviewPage />) },
          { path: 'previews/dashboard', element: render(<DashboardPreviewPage />) },
          { path: 'devices', element: render(<DeviceCenterPage />) },
          { path: 'devices/manage', element: render(<DeviceManagementPage />) },
          { path: 'laboratories/manage', element: render(<LaboratoryManagementPage />) },
          { path: 'strategies', element: render(<StrategyManagementPage />) },
          { path: 'accounts', element: render(<AccountManagementPage />) },
          { path: 'edu/scheduling/import', element: render(<TimetableImportPage />) },
          { path: 'previews/edu-timetable-import', element: render(<TimetableImportPreviewPage />) },
          { path: 'edu/scheduling', element: render(<SchedulingPage />) },
          { path: 'logs/audit', element: render(<AuditLogPage />) },
          { path: 'logs/alerts', element: render(<AlertLogPage />) },
          { path: 'analysis/education', element: render(<EduAnalysisPage />) },
          { path: 'analysis/air-condition', element: render(<AirConditionAnalysisPage />) },
          { path: 'analysis/energy', element: render(<EnergyAnalysisPage />) },
          { path: 'previews/telemetry-analysis', element: render(<TelemetryAnalysisPreviewPage />) },
          {
            path: 'previews/laboratory-filter',
            element: render(<LaboratoryFilterPreviewPage />),
          },
          {
            path: 'previews/device-switch-bars',
            element: render(<DeviceSwitchBarsPreviewPage />),
          },
          {
            path: 'previews/device-data-center',
            element: render(<DeviceDataCenterPreviewPage />),
          },
          {
            path: 'previews/device-control',
            element: render(<DeviceControlPreviewPage />),
          },
          {
            path: 'previews/device-management',
            element: render(<DeviceManagementPreviewPage />),
          },
          {
            path: 'previews/laboratory-management',
            element: render(<LaboratoryManagementPreviewPage />),
          },
          {
            path: 'previews/account-management',
            element: render(<AccountManagementPreviewPage />),
          },
          {
            path: 'previews/strategy-management',
            element: render(<StrategyManagementPreviewPage />),
          },
          {
            path: 'previews/strategy-revision-form',
            element: render(<StrategyRevisionFormPreviewPage />),
          },
          {
            path: 'previews/edu-scheduling',
            element: render(<SchedulingPreviewPage />),
          },
          {
            path: 'previews/notification-center',
            element: render(<NotificationCenterPreviewPage />),
          },
          {
            path: 'previews/log-center',
            element: render(<LogCenterPreviewPage />),
          },
          {
            path: 'previews/edu-analysis',
            element: render(<EduAnalysisPreviewPage />),
          },
        ],
      },
      { path: '*', element: render(<NotFoundPage />) },
    ],
  },
])
