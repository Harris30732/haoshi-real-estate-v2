'use client'

import { useState } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import {
  useScrapeRunLog,
  RUN_LOG_PAGE_SIZE,
  type RunLogStatusFilter,
  type ScrapeRunLogRow,
} from '@/hooks/use-scrape-dashboard'
import { SCRAPE_RUN_STATUS_LABELS } from '@/lib/constants'
import { formatTaiwanTime } from '@/lib/utils'
import type { ScrapeRunStatus } from '@/types/scrape'

/** 狀態篩選按鈕定義（全部 + 5 個 run 狀態）。 */
const STATUS_FILTERS: { value: RunLogStatusFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'passed', label: '成功' },
  { value: 'failed', label: '失敗' },
  { value: 'incomplete', label: '不完整' },
  { value: 'scanning', label: '盤面掃描中' },
  { value: 'scraping', label: '進行中' },
  { value: 'pending', label: '待處理' },
]

/** run 狀態 → Badge 配色。 */
function statusBadgeClass(status: ScrapeRunStatus): string {
  switch (status) {
    case 'passed':
      return 'border-emerald-500/40 text-emerald-600 dark:text-emerald-500'
    case 'failed':
      return 'border-destructive/40 text-destructive'
    case 'incomplete':
      return 'border-amber-500/40 text-amber-600 dark:text-amber-500'
    case 'scanning':
    case 'scraping':
      return 'border-blue-500/40 text-blue-600 dark:text-blue-400'
    default:
      return 'border-border text-muted-foreground'
  }
}

function StatusBadge({ status }: { status: ScrapeRunStatus }) {
  return (
    <Badge variant="outline" className={statusBadgeClass(status)}>
      {SCRAPE_RUN_STATUS_LABELS[status] ?? status}
    </Badge>
  )
}

/** 抓到-總戶數顯示（covered / displayed）。 */
function coverageText(r: ScrapeRunLogRow): string {
  const covered = r.covered_count ?? 0
  const total = r.displayed_count
  return total != null ? `${covered} / ${total}` : `${covered}`
}

/**
 * 任務紀錄表（第二層）。scrape_runs 直查，狀態篩選 + 社區名模糊搜 + 分頁（每頁 20）。
 * 欄位：社區名 / 狀態 / 抓到-總戶數 / 完成時間(台灣時間) / 失敗原因。
 */
export function ScrapeRunLog() {
  const [status, setStatus] = useState<RunLogStatusFilter>('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading, isError } = useScrapeRunLog({ status, search, page })
  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / RUN_LOG_PAGE_SIZE))

  const applySearch = () => {
    setSearch(searchInput.trim())
    setPage(0)
  }

  return (
    <div className="space-y-3">
      {/* 篩選列：狀態按鈕 + 搜尋 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={status === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setStatus(f.value); setPage(0) }}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="relative ml-auto min-w-[180px] flex-1 sm:max-w-[260px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜尋社區名…"
            className="pl-8"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applySearch() }}
          />
        </div>
        <Button variant="outline" size="sm" onClick={applySearch}>搜尋</Button>
      </div>

      {/* 表格 */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs whitespace-nowrap">社區</TableHead>
              <TableHead className="text-xs whitespace-nowrap">狀態</TableHead>
              <TableHead className="text-xs whitespace-nowrap text-right">抓到 / 總戶數</TableHead>
              <TableHead className="text-xs whitespace-nowrap">完成時間</TableHead>
              <TableHead className="text-xs whitespace-nowrap">失敗原因</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-destructive">
                  載入失敗，請重新整理頁面
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  無符合條件的任務紀錄
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id} className="text-sm">
                  <TableCell className="whitespace-nowrap font-medium">
                    {r.community?.name || '—'}
                  </TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">
                    {coverageText(r)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatTaiwanTime(r.finished_at ?? r.updated_at)}
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate text-xs text-muted-foreground" title={r.fail_reason || ''}>
                    {r.fail_reason || '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分頁 */}
      {total > RUN_LOG_PAGE_SIZE && (
        <div className="flex items-center justify-between py-1 text-sm text-muted-foreground">
          <span>共 {total} 筆，第 {page + 1}/{totalPages} 頁</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
