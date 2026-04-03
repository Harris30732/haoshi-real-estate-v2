'use client'

import { useMemo } from 'react'
import { Property } from '@/types/property'
import { useFilters } from './use-filters'

function parseFloor(floorInfo: string | null): number {
  if (!floorInfo) return 0
  const m = floorInfo.match(/(\d+)/)
  return m ? parseInt(m[1]) : 0
}

export function useFilteredProperties(properties: Property[]) {
  const filters = useFilters()

  const dataLimits = useMemo(() => {
    let maxPrice = 0, maxUnitPrice = 0, maxTotalPing = 0, maxHousePing = 0
    let maxParkingPing = 0, maxFloor = 0, maxAge = 0

    properties.forEach((p) => {
      const price = parseFloat(String(p.total_price)) || 0
      const unitPrice = p.unit_price || 0
      const totalPing = parseFloat(String(p.total_ping)) || 0
      const housePing = p.house_ping || 0
      const parkingPing = parseFloat(String(p.parking_ping)) || 0
      const floor = parseFloor(p.floor_info)

      if (price > maxPrice) maxPrice = price
      if (unitPrice > maxUnitPrice) maxUnitPrice = unitPrice
      if (totalPing > maxTotalPing) maxTotalPing = totalPing
      if (housePing > maxHousePing) maxHousePing = housePing
      if (parkingPing > maxParkingPing) maxParkingPing = parkingPing
      if (floor > maxFloor) maxFloor = floor
    })

    // Round up to nice numbers
    maxPrice = Math.ceil(maxPrice / 100) * 100 || 5000
    maxUnitPrice = Math.ceil(maxUnitPrice / 5) * 5 || 100
    maxTotalPing = Math.ceil(maxTotalPing / 10) * 10 || 100
    maxHousePing = Math.ceil(maxHousePing / 10) * 10 || 100
    maxParkingPing = Math.ceil(maxParkingPing / 5) * 5 || 20
    maxFloor = Math.ceil(maxFloor / 5) * 5 || 30
    maxAge = 30

    return { maxPrice, maxUnitPrice, maxTotalPing, maxHousePing, maxParkingPing, maxFloor, maxAge }
  }, [properties])

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      const price = parseFloat(String(p.total_price)) || 0
      const unitPrice = p.unit_price || 0
      const totalPing = parseFloat(String(p.total_ping)) || 0
      const housePing = p.house_ping || 0
      const parkingPing = parseFloat(String(p.parking_ping)) || 0
      const floor = parseFloor(p.floor_info)

      // Range filters
      if (price < filters.priceRange.min || price > filters.priceRange.max) return false
      if (unitPrice < filters.unitPriceRange.min || unitPrice > filters.unitPriceRange.max) return false
      if (totalPing < filters.totalPingRange.min || totalPing > filters.totalPingRange.max) return false
      if (housePing < filters.housePingRange.min || housePing > filters.housePingRange.max) return false
      if (parkingPing < filters.parkingPingRange.min || parkingPing > filters.parkingPingRange.max) return false
      if (floor > 0 && (floor < filters.floorRange.min || floor > filters.floorRange.max)) return false

      // Select filters
      if (filters.communities.length > 0 && !filters.communities.includes(p.community_name)) return false
      if (filters.statuses.length > 0 && !filters.statuses.includes(p.status)) return false
      if (filters.contractTypes.length > 0 && !filters.contractTypes.includes(p.contract_type || '')) return false
      if (filters.layouts.length > 0 && !filters.layouts.includes(p.layout || '')) return false
      if (filters.agents.length > 0 && !filters.agents.includes(p.agent || '')) return false

      return true
    })
  }, [properties, filters])

  return { filtered, dataLimits }
}
