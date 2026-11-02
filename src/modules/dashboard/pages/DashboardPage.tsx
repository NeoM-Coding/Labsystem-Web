import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { getDashboard } from '../api/dashboard'
import { DashboardOverview } from '../components/DashboardOverview'

export default function DashboardPage() {
  const userId = useAuthStore((state) => state.user?.id)
  const [search, setSearch] = useState('')
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 10_000)
    return () => window.clearInterval(timer)
  }, [])
  const query = useQuery({
    queryKey: ['dashboard', userId],
    queryFn: ({ signal }) => getDashboard(signal),
    enabled: Boolean(userId),
    refetchInterval: 30_000,
    refetchOnWindowFocus: 'always',
    placeholderData: undefined,
  })
  return <DashboardOverview data={query.data} now={now} search={search} onSearchChange={setSearch}
    loading={query.isPending} refreshing={query.isFetching} error={query.isError ? '请稍后点击刷新重试' : undefined}
    updatedAt={query.dataUpdatedAt} onRefresh={() => { void query.refetch() }} />
}
