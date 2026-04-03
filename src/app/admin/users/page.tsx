'use client'

import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent } from '@/components/ui/card'

export default function UsersPage() {
  return (
    <AppShell title="使用者管理">
      <Card>
        <CardContent className="flex items-center justify-center text-muted-foreground min-h-[400px]">
          使用者管理 — 接入資料後顯示
        </CardContent>
      </Card>
    </AppShell>
  )
}
