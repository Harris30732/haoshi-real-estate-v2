'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { useScrapeRequests } from '@/hooks/use-scrape-requests'
import { SCRAPE_REQUEST_STATUS_LABELS, SCRAPE_RUN_STATUS_LABELS } from '@/lib/constants'
import type { ScrapeRequestWithRun } from '@/types/scrape'

interface DisplayStatus {
  label: string
  variant: 'secondary' | 'outline' | 'destructive'
  hint?: string
}

/** 由 request 狀態 + 其 run 狀態推導使用者可讀的單一顯示狀態。 */
function deriveStatus(req: ScrapeRequestWithRun): DisplayStatus {
  if (req.status === 'fulfilled') return { label: '完成', variant: 'secondary' }
  if (req.status === 'deduped') return { label: '已共享', variant: 'secondary' }
  if (req.status === 'failed') return { label: '失敗', variant: 'destructive' }

  // queued / waiting：以對應 run 的執行狀態呈現更細的進度。
  const run = req.run?.status
  if (run === 'incomplete')
    return { label: '部分完成', variant: 'outline', hint: '部分完成，系統將自動重試' }
  if (run === 'failed')
    return { label: '失敗', variant: 'destructive', hint: req.run?.fail_reason ?? undefined }
  if (run === 'pending' || run === 'scanning' || run === 'scraping')
    return { label: SCRAPE_RUN_STATUS_LABELS[run], variant: 'outline' }
  return { label: SCRAPE_REQUEST_STATUS_LABELS[req.status], variant: 'outline' }
}

/** 當前店的爬取下單清單，輪詢更新（hook 內 refetchInterval）。 */
export function RequestStatusList() {
  const requests = useScrapeRequests()
  const rows = requests.data ?? []

  return (
    <Card>
      <CardContent className="p-0">
        {requests.isLoading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">載入中…</p>
        ) : requests.isError ? (
          <p className="p-6 text-center text-sm text-destructive">載入失敗，請重新整理頁面</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">尚無爬取下單紀錄</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>社區名稱</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>下單時間</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const s = deriveStatus(r)
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.community_name_input}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <Badge variant={s.variant} className="w-fit">
                          {s.label}
                        </Badge>
                        {s.hint && (
                          <span className="text-xs text-muted-foreground">{s.hint}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(r.created_at).toLocaleString('zh-TW')}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === 'fulfilled' || r.status === 'deduped' ? (
                        <Link
                          href="/transcripts"
                          className="text-sm text-primary hover:underline"
                        >
                          查看謄本
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
