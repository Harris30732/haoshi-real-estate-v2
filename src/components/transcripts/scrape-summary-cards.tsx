'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, ListChecks, Inbox, AlertTriangle } from 'lucide-react'
import { useScrapeDashboardSummary, type ScrapeDashboardSummary } from '@/hooks/use-scrape-dashboard'

/** 卡片統一標題列（圖標 + 標題）。 */
function CardTitleRow({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
      {icon}
      <span>{title}</span>
    </div>
  )
}

/** 一顆帶配色的計數 Badge（label + 數字）。 */
function StatBadge({
  label,
  value,
  className,
}: {
  label: string
  value: number
  className?: string
}) {
  return (
    <Badge variant="outline" className={className}>
      {label} {value}
    </Badge>
  )
}

/** 社區涵蓋卡：with_data / total + 進度條 + 尚未抓取小字。 */
function CoverageCard({ c }: { c: ScrapeDashboardSummary['communities'] }) {
  const pct = c.total > 0 ? Math.round((c.with_data / c.total) * 100) : 0
  return (
    <Card size="sm">
      <CardContent className="space-y-2.5">
        <CardTitleRow icon={<Building2 className="h-4 w-4" />} title="社區涵蓋" />
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold">{c.with_data}</span>
          <span className="text-sm text-muted-foreground">/ {c.total} 社區已有資料</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-primary/15">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground">
          已嘗試 {c.attempted}・尚未抓取 {c.never_attempted}
        </div>
      </CardContent>
    </Card>
  )
}

/** 任務結果卡：passed/failed/incomplete/in_progress/pending 各配色 Badge。 */
function RunsCard({ r }: { r: ScrapeDashboardSummary['runs'] }) {
  return (
    <Card size="sm">
      <CardContent className="space-y-2.5">
        <CardTitleRow icon={<ListChecks className="h-4 w-4" />} title="任務結果" />
        <div className="flex flex-wrap gap-1.5">
          <StatBadge label="成功" value={r.passed} className="border-emerald-500/40 text-emerald-600 dark:text-emerald-500" />
          <StatBadge label="失敗" value={r.failed} className="border-destructive/40 text-destructive" />
          <StatBadge label="不完整" value={r.incomplete} className="border-amber-500/40 text-amber-600 dark:text-amber-500" />
          <StatBadge label="進行中" value={r.in_progress} className="border-blue-500/40 text-blue-600 dark:text-blue-400" />
          <StatBadge label="待處理" value={r.pending} className="border-border text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}

/** 匯入請求卡：fulfilled/failed/deduped/waiting。 */
function RequestsCard({ q }: { q: ScrapeDashboardSummary['requests'] }) {
  return (
    <Card size="sm">
      <CardContent className="space-y-2.5">
        <CardTitleRow icon={<Inbox className="h-4 w-4" />} title="匯入請求" />
        <div className="flex flex-wrap gap-1.5">
          <StatBadge label="完成" value={q.fulfilled} className="border-emerald-500/40 text-emerald-600 dark:text-emerald-500" />
          <StatBadge label="失敗" value={q.failed} className="border-destructive/40 text-destructive" />
          <StatBadge label="已共享" value={q.deduped} className="border-blue-500/40 text-blue-600 dark:text-blue-400" />
          <StatBadge label="等待中" value={q.waiting} className="border-amber-500/40 text-amber-600 dark:text-amber-500" />
        </div>
      </CardContent>
    </Card>
  )
}

/** 失敗原因卡（近 14 天）：逐項列 kind + n。無資料時顯示佔位。 */
function FailBreakdownCard({ items }: { items: ScrapeDashboardSummary['fail_breakdown_14d'] }) {
  return (
    <Card size="sm">
      <CardContent className="space-y-2.5">
        <CardTitleRow icon={<AlertTriangle className="h-4 w-4" />} title="失敗原因（14天）" />
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">近 14 天無失敗</div>
        ) : (
          <div className="space-y-1">
            {items.map((f) => (
              <div key={f.kind} className="flex items-center justify-between text-sm">
                <span className="truncate text-muted-foreground" title={f.kind}>{f.kind}</span>
                <span className="font-medium tabular-nums">{f.n}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * 爬取任務總覽卡片列（第一層）。4 張 Card 一排（手機直排），
 * 資料來自 scrape_dashboard_summary RPC（30s 輪詢）。
 */
export function ScrapeSummaryCards() {
  const { data, isLoading, isError } = useScrapeDashboardSummary()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} size="sm">
            <CardContent className="h-24 animate-pulse bg-muted/40" />
          </Card>
        ))}
      </div>
    )
  }
  if (isError || !data) {
    return (
      <Card size="sm">
        <CardContent className="text-sm text-destructive">總覽載入失敗，請重新整理頁面</CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <CoverageCard c={data.communities} />
      <RunsCard r={data.runs} />
      <RequestsCard q={data.requests} />
      <FailBreakdownCard items={data.fail_breakdown_14d} />
    </div>
  )
}
