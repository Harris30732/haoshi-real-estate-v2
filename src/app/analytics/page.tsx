'use client'

import { AppShell } from '@/components/layout/app-shell'
import { useProperties } from '@/hooks/use-properties'
import { useTranscriptStats } from '@/hooks/use-transcripts'
import { PriceDistributionChart } from '@/components/charts/price-distribution'
import { AreaDistributionChart } from '@/components/charts/area-distribution'
import { CommunityComparisonChart } from '@/components/charts/community-chart'
import { PriceVsAreaChart } from '@/components/charts/price-vs-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PROPERTY_STATUS } from '@/lib/constants'

export default function AnalyticsPage() {
  const { data } = useProperties()
  const { data: stats } = useTranscriptStats()

  const properties = (data?.properties || []).filter(
    (p) => p.status !== PROPERTY_STATUS.DELISTED && p.status !== PROPERTY_STATUS.SOLD
  )

  return (
    <AppShell title="數據分析">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">在售物件</p>
            <p className="text-2xl font-bold">{properties.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">謄本社區</p>
            <p className="text-2xl font-bold">{stats?.communities?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">謄本筆數</p>
            <p className="text-2xl font-bold">{stats?.total?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">平均單價</p>
            <p className="text-2xl font-bold">
              {properties.length > 0
                ? (properties.reduce((s, p) => s + (p.unit_price || 0), 0) / properties.length).toFixed(1) + ' 萬'
                : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PriceDistributionChart properties={properties} />
        <AreaDistributionChart properties={properties} />
        <CommunityComparisonChart properties={properties} />
        <PriceVsAreaChart properties={properties} />
      </div>
    </AppShell>
  )
}
