import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { getCurrentSession } from '@/modules/auth/api/sessions'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { PageLoader } from '@/shared/components/PageLoader'
import { queryClient } from '@/shared/lib/queryClient'
import { router } from './router'

export function App() {
  const previewMode = window.location.pathname.startsWith('/previews/')
  const [checkingSession, setCheckingSession] = useState(!previewMode)

  useEffect(() => {
    if (previewMode) return
    let active = true
    void getCurrentSession()
      .then((session) => {
        if (active) useAuthStore.getState().setSession(session.user)
      })
      .catch(() => {
        if (active) useAuthStore.getState().clearSession()
      })
      .finally(() => {
        if (active) setCheckingSession(false)
      })
    return () => {
      active = false
    }
  }, [previewMode])

  return (
    <QueryClientProvider client={queryClient}>
      {checkingSession
        ? <div className="centered-page"><PageLoader /></div>
        : <RouterProvider router={router} />}
    </QueryClientProvider>
  )
}
