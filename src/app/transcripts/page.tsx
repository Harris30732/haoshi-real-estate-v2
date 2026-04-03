'use client'

import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent } from '@/components/ui/card'

export default function TranscriptsPage() {
  return (
    <AppShell title="謄本資料">
      <Card>
        <CardContent className="flex items-center justify-center text-muted-foreground min-h-[400px]">
          謄本瀏覽 — Phase 3 實作（13,046 筆資料）
        </CardContent>
      </Card>
    </AppShell>
  )
}
