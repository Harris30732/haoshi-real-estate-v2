'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useStores } from '@/hooks/use-stores'
import { usePreviewBilling, useFreezeBilling, useStatements } from '@/hooks/use-billing'
import { BILLING_EVENT_LABELS, fmtMoney, fmtInt, type BillingEventType } from '@/types/pricing'

const selectCls =
  'h-8 rounded-lg border border-input bg-transparent px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'

function defaultPeriod(): { year: number; month: number } {
  // 預設上個月（當月尚未結束、不可結帳）
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

export function BillingMonthPanel() {
  const stores = useStores()
  const def = useMemo(defaultPeriod, [])
  const [storeId, setStoreId] = useState<string>('')
  const [year, setYear] = useState<number>(def.year)
  const [month, setMonth] = useState<number>(def.month)

  const preview = usePreviewBilling(storeId || null, year, month)
  const freeze = useFreezeBilling()
  const statements = useStatements(storeId || null)

  const frozen = statements.data?.find(
    (s) => s.period_year === year && s.period_month === month,
  )

  const lines = preview.data ?? []
  const totalCost = lines.reduce((s, l) => s + Number(l.cost_subtotal), 0)
  const totalSell = lines.reduce((s, l) => s + Number(l.sell_subtotal), 0)
  const totalMargin = totalSell - totalCost

  const years = useMemo(() => {
    const y = new Date().getFullYear()
    return [y, y - 1, y - 2]
  }, [])

  const canFreeze = (() => {
    // 月須已結束才可凍結
    const end = new Date(year, month, 1) // 下月 1 號
    return end <= new Date() && !!storeId && !frozen
  })()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">月結試算</CardTitle>
          <p className="text-sm text-muted-foreground">選店與月份試算用量、成本、售價與毛利；確認後可結帳凍結成帳單。</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">店家</span>
              <select className={selectCls} value={storeId} onChange={(e) => setStoreId(e.target.value)}>
                <option value="">選擇店家…</option>
                {(stores.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}（{s.code}）
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">年</span>
              <select className={selectCls} value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">月</span>
              <select className={selectCls} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
            <div className="ml-auto flex items-center gap-2">
              {frozen && <Badge variant="secondary">已結帳</Badge>}
              <Button
                disabled={!canFreeze || freeze.isPending}
                onClick={() => storeId && freeze.mutate({ storeId, year, month })}
              >
                {freeze.isPending ? '結帳中…' : '結帳凍結'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {!storeId ? (
            <p className="p-6 text-center text-sm text-muted-foreground">請先選擇店家</p>
          ) : preview.isLoading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">試算中…</p>
          ) : lines.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">此月份無用量</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>項目</TableHead>
                  <TableHead className="text-right">數量</TableHead>
                  <TableHead className="text-right">成本小計</TableHead>
                  <TableHead className="text-right">售價小計</TableHead>
                  <TableHead className="text-right">毛利</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((l) => (
                  <TableRow key={l.event_type}>
                    <TableCell>{BILLING_EVENT_LABELS[l.event_type as BillingEventType] ?? l.event_type}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtInt(l.quantity)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMoney(l.cost_subtotal)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMoney(l.sell_subtotal)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMoney(l.margin)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold">
                  <TableCell>合計</TableCell>
                  <TableCell />
                  <TableCell className="text-right tabular-nums">{fmtMoney(totalCost)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtMoney(totalSell)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtMoney(totalMargin)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
