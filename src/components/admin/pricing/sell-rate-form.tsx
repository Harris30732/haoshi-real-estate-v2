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
import { useStoreSellRates, useSetStoreSellRate } from '@/hooks/use-pricing'
import { SELL_EVENT_TYPES, BILLING_EVENT_LABELS, fmtMoney } from '@/types/pricing'

interface SellRateFormProps {
  /** null = 全域預設售價；否則該店售價。 */
  storeId: string | null
  title: string
  description?: string
}

/** 售價費率設定（你對店收的）。按 event_type，支援全域預設 / 每店覆蓋。 */
export function SellRateForm({ storeId, title, description }: SellRateFormProps) {
  const rates = useStoreSellRates(storeId)
  const setRate = useSetStoreSellRate()
  const [draft, setDraft] = useState<Record<string, string>>({})

  const currentOf = (et: string) =>
    rates.data?.find((r) => r.event_type === et)?.unit_price ?? null

  const save = async (et: string) => {
    const raw = draft[et]
    if (raw == null || raw.trim() === '') return
    const n = Number(raw)
    if (!isFinite(n) || n < 0) return
    try {
      await setRate.mutateAsync({ store_id: storeId, event_type: et, unit_price: n })
      setDraft((d) => ({ ...d, [et]: '' }))
    } catch {
      /* onError 已 toast */
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>項目</TableHead>
              <TableHead className="text-right">目前售價</TableHead>
              <TableHead className="w-40">新售價</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {SELL_EVENT_TYPES.map((et) => {
              const cur = currentOf(et)
              return (
                <TableRow key={et}>
                  <TableCell>{BILLING_EVENT_LABELS[et]}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {rates.isLoading ? '…' : cur == null ? <span className="text-muted-foreground">未設定</span> : fmtMoney(cur)}
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
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
