'use client'

import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AnalyticsPage() {
  return (
    <AppShell title="數據分析">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">價格分布</CardTitle></CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
            Phase 2 實作
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">坪數分布</CardTitle></CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
            Phase 2 實作
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">社區比較</CardTitle></CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
            Phase 2 實作
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">價格趨勢</CardTitle></CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
            Phase 2 實作
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
