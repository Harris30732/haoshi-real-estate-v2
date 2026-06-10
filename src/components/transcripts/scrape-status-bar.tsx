'use client'

import { Loader2, AlertTriangle, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useScrapeRequests } from '@/hooks/use-scrape-requests'
import { useScrapeRunProgress, type RunProgress } from '@/hooks/use-scrape-progress'
import { useAuth } from '@/hooks/use-auth'
import type { ScrapeRequestWithRun } from '@/types/scrape'

const ACTIVE_RUN_STATUSES = new Set(['pending', 'scanning', 'scraping'])
const ACTIVE_REQUEST_STATUSES = new Set(['queued', 'waiting'])
const ANOMALY_RUN_STATUSES = new Set(['incomplete', 'failed'])
const ANOMALY_WINDOW_MS = 24 * 60 * 60 * 1000 // 只報「最近 24 小時」的異常，避免歷史堆積

function isActive(req: ScrapeRequestWithRun): boolean {
  if (!ACTIVE_REQUEST_STATUSES.has(req.status)) return false
  const runStatus = req.run?.status
  // pending: run 尚未認領；scanning/scraping: 進行中
  // 若 run.status 不存在（剛建立 < orchestrator schedule）→ 也視為 active
  if (!runStatus) return true
  return ACTIVE_RUN_STATUSES.has(runStatus)
}

/** Owner 專用：最近 24h 內結算為 incomplete / failed 的 run（其他角色看不到）。 */
function isRecentAnomaly(req: ScrapeRequestWithRun): boolean {
  const run = req.run
  if (!run || !ANOMALY_RUN_STATUSES.has(run.status)) return false
  const ts = run.finished_at ?? run.updated_at ?? run.created_at
  return Date.now() - new Date(ts).getTime() < ANOMALY_WINDOW_MS
}

/**
 * 提報店可見：最近 24h 內因「查無社區」失敗的 run（YCUT 盤面搜不到此社區名）。
 * 這類失敗代表名稱可能有誤 → 提示提報店重新確認名稱後重送；其餘失敗仍僅 Owner 可見。
 * fail_reason 由 worker run-executor 在搜尋 0 筆時寫入字串「查無社區: <name>」。
 * 注意：不含「找不到社區連結」（有搜到但點不進，屬技術性，名稱無誤）。
 */
function isRecentNotFound(req: ScrapeRequestWithRun): boolean {
  const run = req.run
  if (!run || run.status !== 'failed') return false
  if (!run.fail_reason?.includes('查無社區')) return false
  const ts = run.finished_at ?? run.updated_at ?? run.created_at
  return Date.now() - new Date(ts).getTime() < ANOMALY_WINDOW_MS
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

type Phase = 'queued' | 'scanning' | 'scraping'

function phaseOf(req: ScrapeRequestWithRun): Phase {
  const s = req.run?.status
  if (s === 'scraping') return 'scraping'
  if (s === 'scanning') return 'scanning'
  return 'queued' // pending / 尚無 run
}

/** 簡易進度條。determinate 時填到 pct%，indeterminate 時整條 pulse。 */
function ProgressBar({ pct, indeterminate }: { pct: number; indeterminate?: boolean }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-primary/15 overflow-hidden">
      {indeterminate ? (
        <div className="h-full w-full bg-primary/40 animate-pulse" />
      ) : (
        <div
          className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
          style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
        />
      )}
    </div>
  )
}

/** 單筆進行中社區：標題 + 階段文字 + 跑條。failed 戶數僅 Owner 看得到。 */
function ActiveRow({
  req,
  progress,
  isOwner,
}: {
  req: ScrapeRequestWithRun
  progress: RunProgress | undefined
  isOwner: boolean
}) {
  const phase = phaseOf(req)
  // 分母優先用盤面實際戶數（record_scan 後落定）；未落定時退回已盤點筆數。
  const total = req.run?.displayed_count ?? progress?.itemTotal ?? 0
  const done = progress?.covered ?? 0
  const failed = progress?.failed ?? 0

  let label: string
  let indeterminate = false
  let pct = 0

  if (phase === 'queued') {
    label = '等待認領中'
    indeterminate = true
  } else if (phase === 'scanning') {
    // 掃描階段尚未寫入逐戶 item → 戶數未知，用不定條
    label = total > 0 ? `盤點戶數中・已盤點 ${total} 戶` : '盤點社區戶數中…'
    indeterminate = true
  } else {
    // scraping：跑條 = 已完成 / 盤面總戶數
    pct = total > 0 ? (done / total) * 100 : 0
    label = total > 0 ? `已解析 ${done} / ${total} 戶` : '解析中…'
    if (total === 0) indeterminate = true
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium truncate">{req.community_name_input}</span>
          {isOwner && failed > 0 && (
            <Badge
              variant="outline"
              className="text-xs shrink-0 border-amber-500/50 text-amber-600 dark:text-amber-500"
            >
              {failed} 戶異常
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      </div>
      <ProgressBar pct={pct} indeterminate={indeterminate} />
    </div>
  )
}

/**
 * 上方狀態欄：當前店「正在抓取」的社區跑條 + （Owner 限定）最近異常回報。
 * - 0 active 且無 Owner 異常 → 自動隱藏（return null）
 * - 進行中：每筆社區顯示階段（等待認領 → 盤點戶數 → 已解析 X/N 戶）+ 跑條
 * - 異常（失敗戶、incomplete/failed）只給 Owner 看；唯「查無社區」失敗也給提報店看（提示重送）；其餘店長/員工看到乾淨進度
 * - 透過 15s（下單清單）+ 5s（逐戶進度）輪詢，跑完自動消失
 */
export function ScrapeStatusBar() {
  const { data, isLoading } = useScrapeRequests()
  const role = useAuth((s) => s.profile?.role_key)
  const isOwner = role === 'owner'

  const requests = data ?? []
  const active = requests.filter(isActive)
  // 只對進行中的 run 拉逐戶進度（pending 無 item，傳了也無妨）。
  const activeRunIds = active.map((r) => r.run_id).filter((id): id is string => !!id)
  const { data: progressMap } = useScrapeRunProgress(activeRunIds)

  const anomalies = isOwner ? requests.filter(isRecentAnomaly) : []
  // 非 Owner（店長/員工）：只看自家「查無社區」失敗，提示重新確認名稱後重送。
  const notFound = isOwner ? [] : requests.filter(isRecentNotFound)

  if (isLoading) return null
  if (active.length === 0 && anomalies.length === 0 && notFound.length === 0) return null

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="py-3 px-4 space-y-3">
        {active.length > 0 && (
          <>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>正在抓取 ({active.length})</span>
            </div>
            <div className="space-y-2.5">
              {active.map((req) => (
                <ActiveRow
                  key={req.id}
                  req={req}
                  progress={req.run_id ? progressMap?.[req.run_id] : undefined}
                  isOwner={isOwner}
                />
              ))}
            </div>
          </>
        )}

        {anomalies.length > 0 && (
          <div className={active.length > 0 ? 'pt-2 border-t border-primary/20' : ''}>
            <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-500">
              <AlertTriangle className="h-4 w-4" />
              <span>需要注意 ({anomalies.length})</span>
              <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                <Eye className="h-3 w-3" />
                僅你可見
              </span>
            </div>
            <div className="space-y-1.5 mt-2">
              {anomalies.map((req) => (
                <div
                  key={req.id}
                  className="flex items-start justify-between gap-2 text-sm"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{req.community_name_input}</span>
                      <Badge
                        variant="outline"
                        className="text-xs shrink-0 border-amber-500/50 text-amber-600 dark:text-amber-500"
                      >
                        {req.run?.status === 'failed' ? '失敗' : '部分完成'}
                      </Badge>
                    </div>
                    {req.run?.fail_reason && (
                      <div className="text-xs text-muted-foreground truncate" title={req.run.fail_reason}>
                        {req.run.fail_reason}
                      </div>
                    )}
                    {req.run?.displayed_count != null && req.run?.covered_count != null && (
                      <div className="text-xs text-muted-foreground">
                        已收錄 {req.run.covered_count} / {req.run.displayed_count} 戶
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {relativeTime(req.run?.finished_at ?? req.run?.updated_at ?? req.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {notFound.length > 0 && (
          <div className={active.length > 0 ? 'pt-2 border-t border-primary/20' : ''}>
            <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-500">
              <AlertTriangle className="h-4 w-4" />
              <span>需要重新確認 ({notFound.length})</span>
            </div>
            <div className="space-y-1.5 mt-2">
              {notFound.map((req) => (
                <div key={req.id} className="flex items-start justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{req.community_name_input}</span>
                      <Badge
                        variant="outline"
                        className="text-xs shrink-0 border-amber-500/50 text-amber-600 dark:text-amber-500"
                      >
                        查無社區
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      永慶盤面查無此社區，請確認名稱正確後重新下單
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {relativeTime(req.run?.finished_at ?? req.run?.updated_at ?? req.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
