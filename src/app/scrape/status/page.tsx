'use client'

import { AppShell } from '@/components/layout/app-shell'
import { RequestStatusList } from '@/components/scrape/request-status-list'
import { PERMISSIONS } from '@/lib/constants'

// 暫以 scrape.submit 作為進入閘門 —— 尚無獨立的「檢視爬取進度」權限，
// 能下單者本就需追蹤自己的下單；未來若拆出獨立權限再改這裡。
export default function ScrapeStatusPage() {
  return (
    <AppShell title="爬取進度" requiredPermission={PERMISSIONS.SCRAPE_SUBMIT}>
      <RequestStatusList />
    </AppShell>
  )
}
