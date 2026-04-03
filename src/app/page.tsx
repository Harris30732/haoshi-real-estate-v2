'use client'

import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Building2, FileText, TrendingUp } from 'lucide-react'

const stats = [
  { label: '物件總數', value: '—', icon: Home, color: 'text-blue-600' },
  { label: '社區數量', value: '—', icon: Building2, color: 'text-purple-600' },
  { label: '謄本資料', value: '13,046', icon: FileText, color: 'text-green-600' },
  { label: '平均單價', value: '—', icon: TrendingUp, color: 'text-orange-600' },
]

export default function DashboardPage() {
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

      {/* Chart Placeholder */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">價格分布</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
            圖表將在 Phase 2 實作
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">社區比較</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
            圖表將在 Phase 2 實作
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
