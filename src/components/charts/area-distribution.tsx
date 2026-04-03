'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Property } from '@/types/property'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  properties: Property[]
}

const AREA_BINS = [
  { label: '20坪以下', min: 0, max: 20 },
  { label: '20-30坪', min: 20, max: 30 },
  { label: '30-40坪', min: 30, max: 40 },
  { label: '40-50坪', min: 40, max: 50 },
  { label: '50-60坪', min: 50, max: 60 },
  { label: '60坪以上', min: 60, max: Infinity },
]

export function AreaDistributionChart({ properties }: Props) {
  const data = AREA_BINS.map((bin) => ({
    name: bin.label,
    count: properties.filter((p) => {
      const ping = parseFloat(String(p.total_ping)) || 0
      return ping >= bin.min && ping < bin.max
    }).length,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">坪數分布</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ left: 0, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip formatter={(value) => [`${value} 件`, '數量']} />
            <Bar dataKey="count" fill="hsl(260, 60%, 55%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
