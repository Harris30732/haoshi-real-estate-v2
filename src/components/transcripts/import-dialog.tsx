'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

function describe(status: ScrapeRequestStatus | null, error: string | null): SubmitResult {
  if (status === 'deduped') return { name: '', status, message: '已有新鮮資料，立即可看' }
  if (status === 'waiting') return { name: '', status, message: '已排入爬取佇列' }
  if (status === 'queued') return { name: '', status, message: '已建立下單' }
  if (status === 'fulfilled') return { name: '', status, message: '已完成' }
  return { name: '', status: status ?? 'failed', message: error ?? '送出失敗' }
}

function resultVariant(status: ScrapeRequestStatus | null) {
  if (status === 'deduped' || status === 'fulfilled') return 'secondary' as const
  if (status === 'failed' || status === null) return 'destructive' as const
  return 'outline' as const
}

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [text, setText] = useState('')
  const [results, setResults] = useState<SubmitResult[]>([])
  const [mergedCount, setMergedCount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const submit = useScrapeSubmit()
  const qc = useQueryClient()

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
    qc.invalidateQueries({ queryKey: ['scrape-requests'] })
  }

  const handleClose = () => {
    if (submitting) return
    setText('')
    setResults([])
    setMergedCount(0)
    onOpenChange(false)
  }

  const validCount = Array.from(
    new Set(text.split('\n').map((s) => s.trim()).filter(Boolean)),
  ).length

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : handleClose())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>匯入社區</DialogTitle>
          <DialogDescription>
            一行一個社區名稱。送出後會排入爬取佇列，狀態會顯示在上方狀態欄。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={submitting}
            rows={8}
            placeholder={'每行一個社區名稱，例如：\n冠德遠見\n國泰天母\n華固名鑄'}
          />

          {results.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-auto rounded-md border p-2">
              {mergedCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  已自動合併 {mergedCount} 筆重複社區名。
                </p>
              )}
              {results.map((r, i) => (
                <div
                  key={`${r.name}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-sm border p-2"
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
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            {submitting ? '送出中…' : '關閉'}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || validCount === 0}>
            {submitting ? '送出中…' : `送出${validCount > 0 ? ` ${validCount} 個社區` : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
