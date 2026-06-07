'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { useBillingOverview } from '@/hooks/use-billing'
import { fmtMoney, fmtInt } from '@/types/pricing'

const selectCls =
  'h-8 rounded-lg border border-input bg-transparent px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'

export function BillingOverviewTable() {
  const now = new Date()
  const [year, setYear] = useState<number>(now.getFullYear())
  const [month, setMonth] = useState<number>(now.getMonth() + 1)
  const overview = useBillingOverview(year, month)

  const years = useMemo(() => {
    const y = new Date().getFullYear()
    return [y, y - 1, y - 2]
  }, [])

  const rows = (overview.data ?? []).filter((r) => Number(r.quantity_total) > 0)
  const tCost = rows.reduce((s, r) => s + Number(r.cost_total), 0)
  const tSell = rows.reduce((s, r) => s + Number(r.sell_total), 0)
  const tMargin = tSell - tCost

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">跨店總覽</CardTitle>
        <div className="flex flex-wrap items-end gap-3 pt-2">
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
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {overview.isLoading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">載入中…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">此月份無任何店家用量</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>店家</TableHead>
                <TableHead className="text-right">用量</TableHead>
                <TableHead className="text-right">成本</TableHead>
                <TableHead className="text-right">售價</TableHead>
                <TableHead className="text-right">毛利</TableHead>
                <TableHead className="text-center">狀態</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.store_id}>
                  <TableCell>{r.store_name}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtInt(r.quantity_total)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtMoney(r.cost_total)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtMoney(r.sell_total)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtMoney(r.margin_total)}</TableCell>
                  <TableCell className="text-center">
                    {r.is_frozen ? <Badge variant="secondary">已結帳</Badge> : <span className="text-xs text-muted-foreground">未結</span>}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold">
                <TableCell>合計</TableCell>
                <TableCell />
                <TableCell className="text-right tabular-nums">{fmtMoney(tCost)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmtMoney(tSell)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmtMoney(tMargin)}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
