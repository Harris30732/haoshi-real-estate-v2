'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { useCostRates, useSetCostRate } from '@/hooks/use-pricing'
import { COST_EVENT_TYPES, BILLING_EVENT_LABELS, fmtMoney } from '@/types/pricing'

/** 全域成本費率設定（你付的成本，如 Gemini 費）。按 event_type。 */
export function CostRateForm() {
  const rates = useCostRates()
  const setRate = useSetCostRate()
  const [draft, setDraft] = useState<Record<string, string>>({})

  const currentOf = (et: string) =>
    rates.data?.find((r) => r.event_type === et)?.unit_cost ?? 0

  const save = async (et: string) => {
    const raw = draft[et]
    if (raw == null || raw.trim() === '') return
    const n = Number(raw)
    if (!isFinite(n) || n < 0) return
    try {
      await setRate.mutateAsync({ event_type: et, unit_cost: n })
      setDraft((d) => ({ ...d, [et]: '' }))
    } catch {
      /* onError 已 toast */
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">成本費率（全域）</CardTitle>
        <p className="text-sm text-muted-foreground">你的實際成本，用於計算毛利。店家看不到此頁。</p>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>項目</TableHead>
              <TableHead className="text-right">目前單價</TableHead>
              <TableHead className="w-40">新單價</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {COST_EVENT_TYPES.map((et) => (
              <TableRow key={et}>
                <TableCell>{BILLING_EVENT_LABELS[et]}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {rates.isLoading ? '…' : fmtMoney(currentOf(et))}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    step="0.0001"
                    placeholder="0"
                    value={draft[et] ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, [et]: e.target.value }))}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={setRate.isPending || (draft[et] ?? '').trim() === ''}
                    onClick={() => save(et)}
                  >
                    儲存
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
