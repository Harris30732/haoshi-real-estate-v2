'use client'

import { Property } from '@/types/property'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, MapPin, Ruler, DollarSign } from 'lucide-react'

interface PropertyCardProps {
  property: Property
  onEdit?: (property: Property) => void
  onDelete?: (id: string) => void
}

const fmt = (n: number | null | undefined) =>
  n != null && !isNaN(n) ? n.toLocaleString('zh-TW', { maximumFractionDigits: 2 }) : '—'

export function PropertyCard({ property: p, onEdit, onDelete }: PropertyCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-sm">{p.community_name}</h3>
            {p.address && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />{p.address}
              </p>
            )}
          </div>
          <div className="flex gap-1">
            {p.status && <Badge variant="secondary" className="text-xs">{p.status}</Badge>}
            {p.contract_type && <Badge variant="outline" className="text-xs">{p.contract_type}</Badge>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" />總價
            </p>
            <p className="font-semibold">{fmt(p.total_price)} 萬</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Ruler className="h-3 w-3" />坪數
            </p>
            <p className="font-semibold">{fmt(p.total_ping)} 坪</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">單價</p>
            <p className="font-semibold">{fmt(p.unit_price)} 萬</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            {p.floor_info || '—'} · {p.layout || '—'}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit?.(p)}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete?.(p.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
