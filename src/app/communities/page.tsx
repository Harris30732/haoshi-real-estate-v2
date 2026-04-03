'use client'

import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function CommunitiesPage() {
  return (
    <AppShell title="社區管理">
      <div className="flex items-center justify-between mb-4">
        <div />
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          新增社區
        </Button>
      </div>
      <Card>
        <CardContent className="flex items-center justify-center text-muted-foreground min-h-[400px]">
          社區清單 — 接入資料後顯示
        </CardContent>
      </Card>
    </AppShell>
  )
}
