'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Property } from '@/types/property'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PRICE_RANGES } from '@/lib/constants'

interface Props {
  properties: Property[]
}

export function PriceDistributionChart({ properties }: Props) {
  const data = PRICE_RANGES.map((range) => ({
    name: range.label,
    count: properties.filter((p) => {
      const price = parseFloat(String(p.total_price)) || 0
      return price >= range.min && price < range.max
    }).length,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">價格分布</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis type="number" fontSize={11} />
            <YAxis type="category" dataKey="name" fontSize={11} width={80} />
            <Tooltip formatter={(value) => [`${value} 件`, '數量']} />
            <Bar dataKey="count" fill="hsl(220, 70%, 55%)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
