'use client'

import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useScrapeRequests } from '@/hooks/use-scrape-requests'
import { SCRAPE_RUN_STATUS_LABELS } from '@/lib/constants'
import type { ScrapeRequestWithRun } from '@/types/scrape'

const ACTIVE_RUN_STATUSES = new Set(['pending', 'scanning', 'scraping'])
const ACTIVE_REQUEST_STATUSES = new Set(['queued', 'waiting'])

function isActive(req: ScrapeRequestWithRun): boolean {
  if (!ACTIVE_REQUEST_STATUSES.has(req.status)) return false
  const runStatus = req.run?.status
  // pending: run 尚未認領；scanning/scraping: 進行中
  // 若 run.status 不存在（剛建立 < orchestrator schedule）→ 也視為 active
  if (!runStatus) return true
  return ACTIVE_RUN_STATUSES.has(runStatus)
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60_000)
  if (min < 1) return '剛剛'
  if (min < 60) return `${min} 分鐘前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} 小時前`
  return `${Math.floor(hr / 24)} 天前`
}

function statusLabel(req: ScrapeRequestWithRun): string {
  const runStatus = req.run?.status
  if (runStatus && ACTIVE_RUN_STATUSES.has(runStatus)) {
    return SCRAPE_RUN_STATUS_LABELS[runStatus]
  }
  return '排入佇列'
}

/**
 * 上方狀態欄：列出當前店「正在抓取」的社區。
 * - 0 active 自動隱藏（return null）
 * - 顯示時：每筆社區 + 狀態 + 相對時間
 * - 透過 useScrapeRequests 自動 15s 輪詢，跑完自動消失
 */
export function ScrapeStatusBar() {
  const { data, isLoading } = useScrapeRequests()
  if (isLoading) return null
  const active = (data ?? []).filter(isActive)
  if (active.length === 0) return null

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-2 mb-2 text-sm font-medium">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>正在抓取 ({active.length})</span>
        </div>
        <div className="space-y-1.5">
          {active.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium truncate">{req.community_name_input}</span>
                <Badge variant="outline" className="text-xs shrink-0">
                  {statusLabel(req)}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {relativeTime(req.created_at)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
