'use client'

import { create } from 'zustand'

export interface FilterRange {
  min: number
  max: number
}

interface FiltersState {
  // Range filters (dual sliders)
  priceRange: FilterRange
  unitPriceRange: FilterRange
  totalPingRange: FilterRange
  housePingRange: FilterRange
  parkingPingRange: FilterRange
  floorRange: FilterRange
  ageRange: FilterRange

  // Select filters
  communities: string[]
  statuses: string[]
  contractTypes: string[]
  layouts: string[]
  agents: string[]

  // Actions
  setRange: (key: string, range: FilterRange) => void
  setSelect: (key: string, values: string[]) => void
  resetAll: () => void
}

const defaultRanges = {
  priceRange: { min: 0, max: 10000 },
  unitPriceRange: { min: 0, max: 100 },
  totalPingRange: { min: 0, max: 200 },
  housePingRange: { min: 0, max: 150 },
  parkingPingRange: { min: 0, max: 30 },
  floorRange: { min: 0, max: 30 },
  ageRange: { min: 0, max: 30 },
}

export const useFilters = create<FiltersState>((set) => ({
  ...defaultRanges,
  communities: [],
  statuses: [],
  contractTypes: [],
  layouts: [],
  agents: [],

  setRange: (key, range) => set({ [key]: range }),
  setSelect: (key, values) => set({ [key]: values }),
  resetAll: () => set({ ...defaultRanges, communities: [], statuses: [], contractTypes: [], layouts: [], agents: [] }),
}))
