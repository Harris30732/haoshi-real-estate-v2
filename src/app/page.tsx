'use client'

import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Building2, FileText, TrendingUp } from 'lucide-react'
import { useProperties } from '@/hooks/use-properties'
import { useTranscriptStats } from '@/hooks/use-transcripts'
import { PriceDistributionChart } from '@/components/charts/price-distribution'
import { CommunityComparisonChart } from '@/components/charts/community-chart'
import { PROPERTY_STATUS } from '@/lib/constants'

export default function DashboardPage() {
  const { data } = useProperties()
  const { data: transcriptStats } = useTranscriptStats()

  const properties = data?.properties || []
  const communities = data?.communities || []
  const activeProperties = properties.filter(
    (p) => p.status !== PROPERTY_STATUS.DELISTED && p.status !== PROPERTY_STATUS.SOLD
  )

  const avgUnitPrice = activeProperties.length > 0
    ? (activeProperties.reduce((s, p) => s + (p.unit_price || 0), 0) / activeProperties.length).toFixed(1)
    : '—'

  const stats = [
    { label: '物件總數', value: activeProperties.length.toString(), icon: Home, color: 'text-blue-600' },
    { label: '社區數量', value: communities.length.toString(), icon: Building2, color: 'text-purple-600' },
    { label: '謄本資料', value: transcriptStats?.total?.toLocaleString() || '—', icon: FileText, color: 'text-green-600' },
    { label: '平均單價', value: avgUnitPrice === '—' ? '—' : `${avgUnitPrice} 萬`, icon: TrendingUp, color: 'text-orange-600' },
  ]

  return (
    <AppShell title="儀表板">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <PriceDistributionChart properties={activeProperties} />
        <CommunityComparisonChart properties={activeProperties} />
      </div>
    </AppShell>
  )
}
