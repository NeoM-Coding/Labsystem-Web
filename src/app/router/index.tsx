import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/app/layouts/AppLayout'
import { PageLoader } from '@/shared/components/PageLoader'

const DashboardPage = lazy(() => import('@/modules/dashboard/pages/DashboardPage'))
const LoginPage = lazy(() => import('@/modules/auth/pages/LoginPage'))
const NotFoundPage = lazy(() => import('@/modules/errors/pages/NotFoundPage'))
const LaboratoryFilterPreviewPage = lazy(
  () => import('@/modules/laboratory/pages/LaboratoryFilterPreviewPage'),
)
const LaboratoryPickerPreviewPage = lazy(
  () => import('@/modules/laboratory/pages/LaboratoryPickerPreviewPage'),
)
const DeviceCenterPage = lazy(() => import('@/modules/device/pages/DeviceCenterPage'))
const DeviceSwitchBarsPreviewPage = lazy(
  () => import('@/modules/device/pages/DeviceSwitchBarsPreviewPage'),
)
const DeviceDataCenterPreviewPage = lazy(
  () => import('@/modules/device/pages/DeviceDataCenterPreviewPage'),
)
const DeviceControlPreviewPage = lazy(
  () => import('@/modules/device/pages/DeviceControlPreviewPage'),
)

const render = (element: React.ReactNode) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
)

export const router = createBrowserRouter([
  { path: '/login', element: render(<LoginPage />) },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: render(<DashboardPage />) },
      { path: 'devices', element: render(<DeviceCenterPage />) },
      {
        path: 'previews/laboratory-filter',
        element: render(<LaboratoryFilterPreviewPage />),
      },
      {
        path: 'previews/laboratory-picker',
        element: render(<LaboratoryPickerPreviewPage />),
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
    ],
  },
  { path: '*', element: render(<NotFoundPage />) },
])
