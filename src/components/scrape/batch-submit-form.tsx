'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useScrapeSubmit } from '@/hooks/use-scrape-submit'
import { SCRAPE_REQUEST_STATUS_LABELS } from '@/lib/constants'
import type { ScrapeRequestStatus } from '@/types/scrape'

interface SubmitResult {
  name: string
  status: ScrapeRequestStatus | null
  message: string
}

/** 下單結果 → badge 樣式 + 說明文字。 */
function describe(status: ScrapeRequestStatus | null, error: string | null): SubmitResult {
  if (status === 'deduped')
    return { name: '', status, message: '已有新鮮資料，立即可看' }
  if (status === 'waiting')
    return { name: '', status, message: '已排入爬取佇列' }
  if (status === 'queued')
    return { name: '', status, message: '已建立下單' }
  if (status === 'fulfilled')
    return { name: '', status, message: '已完成' }
  return { name: '', status: status ?? 'failed', message: error ?? '送出失敗' }
}

function resultVariant(status: ScrapeRequestStatus | null) {
  if (status === 'deduped' || status === 'fulfilled') return 'secondary' as const
  if (status === 'failed' || status === null) return 'destructive' as const
  return 'outline' as const
}

/**
 * 批次謄本下單表單：貼多行社區名 → 逐筆呼叫 submit_scrape_request RPC → 顯示每筆結果。
 * 並發決策（dedup / 掛載 run）在 RPC 內；前端只負責拆行、去重、迴圈、彙整結果。
 */
export function BatchSubmitForm() {
  const [text, setText] = useState('')
  const [results, setResults] = useState<SubmitResult[]>([])
  const [mergedCount, setMergedCount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const submit = useScrapeSubmit()

  const handleSubmit = async () => {
    const rawNames = text.split('\n').map((s) => s.trim()).filter(Boolean)
    const names = Array.from(new Set(rawNames))
    if (names.length === 0) return

    setSubmitting(true)
    setResults([])
    setMergedCount(rawNames.length - names.length)

    const collected: SubmitResult[] = []
    for (const name of names) {
      try {
        const row = await submit.mutateAsync(name)
        collected.push({ ...describe(row.status, null), name })
      } catch (e) {
        const msg = e instanceof Error ? e.message : '送出失敗'
        collected.push({ ...describe(null, msg), name })
      }
      setResults([...collected])
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>批次下單</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={submitting}
            rows={8}
            placeholder={'每行一個社區名稱，例如：\n冠德遠見\n國泰天母\n華固名鑄'}
          />
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={submitting || !text.trim()}>
              {submitting ? '送出中…' : '送出爬取'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>下單結果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mergedCount > 0 && (
              <p className="text-xs text-muted-foreground">
                已自動合併 {mergedCount} 筆重複社區名。
              </p>
            )}
            {results.map((r, i) => (
              <div
                key={`${r.name}-${i}`}
                className="flex items-center justify-between gap-3 rounded-md border p-3"
              >
                <span className="truncate text-sm font-medium">{r.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{r.message}</span>
                  <Badge variant={resultVariant(r.status)}>
                    {r.status ? SCRAPE_REQUEST_STATUS_LABELS[r.status] : '失敗'}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
