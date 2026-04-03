'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Property } from '@/types/property'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  properties: Property[]
}

export function CommunityComparisonChart({ properties }: Props) {
  // Group by community and calculate avg unit price
  const communityMap: Record<string, { total: number; count: number; avgPing: number }> = {}
  properties.forEach((p) => {
    const name = p.community_name || '未知'
    if (!communityMap[name]) communityMap[name] = { total: 0, count: 0, avgPing: 0 }
    communityMap[name].count++
    communityMap[name].total += p.unit_price || 0
    communityMap[name].avgPing += parseFloat(String(p.total_ping)) || 0
  })

  const data = Object.entries(communityMap)
    .map(([name, v]) => ({
      name: name.length > 8 ? name.substring(0, 8) + '...' : name,
      fullName: name,
      avgPrice: v.count > 0 ? Math.round(v.total / v.count * 100) / 100 : 0,
      count: v.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">社區比較 (Top 10)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis type="number" fontSize={11} />
            <YAxis type="category" dataKey="name" fontSize={10} width={75} />
            <Tooltip
              formatter={(value, name) => [
                name === 'count' ? `${value} 件` : `${value} 萬/坪`,
                name === 'count' ? '件數' : '均價',
              ]}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
            />
            <Bar dataKey="count" fill="hsl(160, 60%, 45%)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
