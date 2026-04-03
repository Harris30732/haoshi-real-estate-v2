'use client'

import { use } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Pencil, MapPin, Building2, DollarSign, Ruler, Key, FileText } from 'lucide-react'
import Link from 'next/link'
import { useProperties } from '@/hooks/use-properties'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const AREA_COLORS = ['hsl(220, 70%, 55%)', 'hsl(160, 60%, 45%)', 'hsl(260, 60%, 55%)', 'hsl(30, 80%, 55%)']

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data } = useProperties()
  const property = data?.properties?.find((p) => p.id === id)

  if (!property) {
    return (
      <AppShell title="物件詳情">
        <div className="text-center py-20 text-muted-foreground">
          找不到此物件
          <div className="mt-4">
            <Link href="/properties"><Button variant="outline">返回列表</Button></Link>
          </div>
        </div>
      </AppShell>
    )
  }

  const p = property
  const fmt = (n: number | null | undefined) => n != null && !isNaN(n) ? n.toLocaleString('zh-TW', { maximumFractionDigits: 2 }) : '—'

  // Area breakdown for pie chart
  const areaData = [
    { name: '主建物', value: p.main_area_ping || 0 },
    { name: '附屬建物', value: p.accessory_area_ping || 0 },
    { name: '公設', value: p.public_area_ping || 0 },
    { name: '車位', value: parseFloat(String(p.parking_ping)) || 0 },
  ].filter((d) => d.value > 0)

  return (
    <AppShell title={p.community_name}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href="/properties">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />返回</Button>
          </Link>
          <div>
            <h2 className="text-xl font-bold">{p.community_name}</h2>
            {p.address && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />{p.address}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {p.status && <Badge>{p.status}</Badge>}
          {p.contract_type && <Badge variant="outline">{p.contract_type}</Badge>}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" />價格資訊</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div><p className="text-xs text-muted-foreground">總價</p><p className="text-lg font-bold">{fmt(p.total_price)} 萬</p></div>
              <div><p className="text-xs text-muted-foreground">單價</p><p className="text-lg font-bold">{fmt(p.unit_price)} 萬/坪</p></div>
              <div><p className="text-xs text-muted-foreground">車價</p><p className="text-lg font-bold">{fmt(p.parking_price)} 萬</p></div>
              <div><p className="text-xs text-muted-foreground">樓層</p><p className="text-lg font-bold">{p.floor_info || '—'}</p></div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div><p className="text-xs text-muted-foreground">總坪</p><p className="font-semibold">{fmt(p.total_ping)} 坪</p></div>
              <div><p className="text-xs text-muted-foreground">室內坪</p><p className="font-semibold">{fmt(p.house_ping)} 坪</p></div>
              <div><p className="text-xs text-muted-foreground">車位坪</p><p className="font-semibold">{fmt(p.parking_ping)} 坪</p></div>
              <div><p className="text-xs text-muted-foreground">格局</p><p className="font-semibold">{p.layout || '—'}</p></div>
            </div>
          </CardContent>
        </Card>

        {/* Area Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Ruler className="h-4 w-4" />面積拆解</CardTitle>
          </CardHeader>
          <CardContent>
            {areaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={areaData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, value }) => `${name} ${value}坪`} fontSize={10}>
                    {areaData.map((_, i) => <Cell key={i} fill={AREA_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} 坪`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">無面積資料</p>
            )}
          </CardContent>
        </Card>

        {/* Ownership */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Key className="h-4 w-4" />產權資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">所有權人</span><span>{p.current_owner || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">登記原因</span><span>{p.registration_reason || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">登記時間</span><span>{p.registration_date || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">擔保金額</span><span>{p.mortgage_amount ? Number(p.mortgage_amount).toLocaleString() : '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">權利種類</span><span>{p.rights_type || '—'}</span></div>
          </CardContent>
        </Card>

        {/* Commission */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4" />委託資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">委託形式</span><span>{p.contract_type || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">委託人</span><span>{p.consignor || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">負責人</span><span>{p.agent || p.maintainer || '—'}</span></div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" />備註</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{p.notes || '無備註'}</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
