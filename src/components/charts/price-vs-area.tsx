'use client'

import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ZAxis } from 'recharts'
import { Property } from '@/types/property'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  properties: Property[]
}

export function PriceVsAreaChart({ properties }: Props) {
  const data = properties
    .filter((p) => p.total_ping && p.total_price)
    .map((p) => ({
      ping: parseFloat(String(p.total_ping)) || 0,
      price: parseFloat(String(p.total_price)) || 0,
      name: p.community_name,
      unitPrice: p.unit_price || 0,
    }))
    .filter((d) => d.ping > 0 && d.price > 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">總價 vs 坪數</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <ScatterChart margin={{ left: 0, right: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="ping" name="坪數" unit="坪" fontSize={11} />
            <YAxis dataKey="price" name="總價" unit="萬" fontSize={11} />
            <ZAxis range={[30, 30]} />
            <Tooltip
              formatter={(value, name) => [
                `${Number(value).toLocaleString()} ${name === '坪數' ? '坪' : '萬'}`,
                String(name),
              ]}
              labelFormatter={() => ''}
              content={({ payload }) => {
                if (!payload?.[0]) return null
                const d = payload[0].payload
                return (
                  <div className="bg-popover border rounded-md p-2 text-xs shadow-md">
                    <p className="font-medium">{d.name}</p>
                    <p>總價: {d.price.toLocaleString()} 萬</p>
                    <p>坪數: {d.ping} 坪</p>
                    <p>單價: {d.unitPrice.toFixed(1)} 萬/坪</p>
                  </div>
                )
              }}
            />
            <Scatter data={data} fill="hsl(30, 80%, 55%)" opacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
