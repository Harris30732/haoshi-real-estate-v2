'use client'

import { useFilters } from '@/hooks/use-filters'
import { RangeFilter } from './range-filter'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Property } from '@/types/property'

interface PropertyFiltersProps {
  allProperties: Property[]
  dataLimits: {
    maxPrice: number
    maxUnitPrice: number
    maxTotalPing: number
    maxHousePing: number
    maxParkingPing: number
    maxFloor: number
    maxAge: number
  }
}

export function PropertyFilters({ dataLimits }: PropertyFiltersProps) {
  const [expanded, setExpanded] = useState(true)
  const filters = useFilters()

  const activeCount = useMemo(() => {
    let count = 0
    if (filters.priceRange.min > 0 || filters.priceRange.max < dataLimits.maxPrice) count++
    if (filters.unitPriceRange.min > 0 || filters.unitPriceRange.max < dataLimits.maxUnitPrice) count++
    if (filters.totalPingRange.min > 0 || filters.totalPingRange.max < dataLimits.maxTotalPing) count++
    if (filters.housePingRange.min > 0 || filters.housePingRange.max < dataLimits.maxHousePing) count++
    if (filters.parkingPingRange.min > 0 || filters.parkingPingRange.max < dataLimits.maxParkingPing) count++
    if (filters.communities.length > 0) count++
    if (filters.statuses.length > 0) count++
    if (filters.layouts.length > 0) count++
    return count
  }, [filters, dataLimits])

  return (
    <div className="rounded-lg border bg-card">
      <button
        className="flex w-full items-center justify-between p-3 text-sm font-medium"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          篩選器
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-xs">{activeCount} 個條件</Badge>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="border-t p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <RangeFilter
              label="總價"
              unit="萬"
              min={0}
              max={dataLimits.maxPrice}
              step={50}
              value={[filters.priceRange.min, filters.priceRange.max]}
              onChange={([min, max]) => filters.setRange('priceRange', { min, max })}
            />
            <RangeFilter
              label="單價"
              unit="萬/坪"
              min={0}
              max={dataLimits.maxUnitPrice}
              step={1}
              value={[filters.unitPriceRange.min, filters.unitPriceRange.max]}
              onChange={([min, max]) => filters.setRange('unitPriceRange', { min, max })}
            />
            <RangeFilter
              label="總坪數"
              unit="坪"
              min={0}
              max={dataLimits.maxTotalPing}
              step={1}
              value={[filters.totalPingRange.min, filters.totalPingRange.max]}
              onChange={([min, max]) => filters.setRange('totalPingRange', { min, max })}
            />
            <RangeFilter
              label="室內坪"
              unit="坪"
              min={0}
              max={dataLimits.maxHousePing}
              step={1}
              value={[filters.housePingRange.min, filters.housePingRange.max]}
              onChange={([min, max]) => filters.setRange('housePingRange', { min, max })}
            />
            <RangeFilter
              label="車位坪"
              unit="坪"
              min={0}
              max={dataLimits.maxParkingPing}
              step={0.5}
              value={[filters.parkingPingRange.min, filters.parkingPingRange.max]}
              onChange={([min, max]) => filters.setRange('parkingPingRange', { min, max })}
            />
            <RangeFilter
              label="樓層"
              unit="F"
              min={0}
              max={dataLimits.maxFloor}
              step={1}
              value={[filters.floorRange.min, filters.floorRange.max]}
              onChange={([min, max]) => filters.setRange('floorRange', { min, max })}
            />
            <RangeFilter
              label="屋齡"
              unit="年"
              min={0}
              max={dataLimits.maxAge}
              step={1}
              value={[filters.ageRange.min, filters.ageRange.max]}
              onChange={([min, max]) => filters.setRange('ageRange', { min, max })}
            />
          </div>

          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={filters.resetAll}>
              <RotateCcw className="h-3 w-3 mr-1" />
              重設篩選
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
