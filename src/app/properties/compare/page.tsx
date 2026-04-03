'use client'

import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'
import { useCompare } from '@/hooks/use-compare'
import { useProperties } from '@/hooks/use-properties'
import { Property } from '@/types/property'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend, Tooltip,
} from 'recharts'

const COLORS = ['hsl(220, 70%, 55%)', 'hsl(160, 60%, 45%)', 'hsl(30, 80%, 55%)', 'hsl(260, 60%, 55%)', 'hsl(340, 70%, 55%)', 'hsl(100, 50%, 45%)']

const COMPARE_FIELDS: { key: string; label: string; unit: string; getValue: (p: Property) => number }[] = [
  { key: 'total_price', label: '總價', unit: '萬', getValue: (p) => parseFloat(String(p.total_price)) || 0 },
  { key: 'unit_price', label: '單價', unit: '萬/坪', getValue: (p) => p.unit_price || 0 },
  { key: 'total_ping', label: '總坪', unit: '坪', getValue: (p) => parseFloat(String(p.total_ping)) || 0 },
  { key: 'house_ping', label: '室內坪', unit: '坪', getValue: (p) => p.house_ping || 0 },
  { key: 'parking_ping', label: '車位坪', unit: '坪', getValue: (p) => parseFloat(String(p.parking_ping)) || 0 },
]

function normalizeForRadar(properties: Property[]) {
  const maxValues: Record<string, number> = {}
  COMPARE_FIELDS.forEach((f) => {
    maxValues[f.key] = Math.max(...properties.map((p) => f.getValue(p)), 1)
  })

  return COMPARE_FIELDS.map((f) => {
    const row: Record<string, unknown> = { field: f.label }
    properties.forEach((p, i) => {
      row[`p${i}`] = Math.round((f.getValue(p) / maxValues[f.key]) * 100)
    })
    return row
  })
}

export default function ComparePage() {
  const { selectedIds, clear } = useCompare()
  const { data } = useProperties()

  const allProperties = data?.properties || []
  const selected = selectedIds
    .map((id) => allProperties.find((p) => p.id === id))
    .filter(Boolean) as Property[]

  const radarData = normalizeForRadar(selected)

  if (selected.length === 0) {
    return (
      <AppShell title="物件比較">
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="mb-4">請先在物件清單勾選 2-6 個物件</p>
          <Link href="/properties">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-1" />
              回到物件清單
            </Button>
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="物件比較">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link href="/properties">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回
            </Button>
          </Link>
          <Badge variant="secondary">{selected.length} 個物件</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={clear}>
          清除選取
        </Button>
      </div>

      {/* Radar Chart */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">多維度比較</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="field" fontSize={12} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={10} />
              {selected.map((p, i) => (
                <Radar
                  key={p.id}
                  name={p.community_name}
                  dataKey={`p${i}`}
                  stroke={COLORS[i]}
                  fill={COLORS[i]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Side-by-side Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left text-xs font-medium text-muted-foreground w-28">欄位</th>
                {selected.map((p, i) => (
                  <th key={p.id} className="p-3 text-left min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="font-medium text-xs">{p.community_name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: '地址', get: (p: Property) => p.address || '—' },
                { label: '總價', get: (p: Property) => `${parseFloat(String(p.total_price))?.toLocaleString() || '—'} 萬` },
                { label: '單價', get: (p: Property) => `${p.unit_price?.toFixed(1) || '—'} 萬/坪` },
                { label: '總坪', get: (p: Property) => `${parseFloat(String(p.total_ping)) || '—'} 坪` },
                { label: '室內坪', get: (p: Property) => `${p.house_ping?.toFixed(1) || '—'} 坪` },
                { label: '車位坪', get: (p: Property) => `${parseFloat(String(p.parking_ping)) || '—'} 坪` },
                { label: '車價', get: (p: Property) => `${parseFloat(String(p.parking_price))?.toLocaleString() || '—'} 萬` },
                { label: '樓層', get: (p: Property) => p.floor_info || '—' },
                { label: '格局', get: (p: Property) => p.layout || '—' },
                { label: '狀態', get: (p: Property) => p.status || '—' },
                { label: '委託', get: (p: Property) => p.contract_type || '—' },
                { label: '委託人', get: (p: Property) => p.consignor || '—' },
                { label: '備註', get: (p: Property) => p.notes || '—' },
              ].map((row) => {
                const values = selected.map((p) => row.get(p))
                const allSame = values.every((v) => v === values[0])
                return (
                  <tr key={row.label} className="border-b hover:bg-muted/30">
                    <td className="p-3 text-xs font-medium text-muted-foreground">{row.label}</td>
                    {selected.map((p, i) => {
                      const val = row.get(p)
                      const isMax = !allSame && ['總價', '單價', '總坪', '室內坪'].includes(row.label) &&
                        val === values.reduce((a, b) => (parseFloat(a) > parseFloat(b) ? a : b))
                      const isMin = !allSame && ['總價', '單價'].includes(row.label) &&
                        val === values.reduce((a, b) => (parseFloat(a) < parseFloat(b) ? a : b))
                      return (
                        <td key={p.id} className={`p-3 text-xs ${isMax ? 'text-orange-500 font-semibold' : ''} ${isMin ? 'text-green-500 font-semibold' : ''}`}>
                          {val}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppShell>
  )
}
