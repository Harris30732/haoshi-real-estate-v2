'use client'

import { create } from 'zustand'

interface CompareState {
  selectedIds: string[]
  toggle: (id: string) => void
  clear: () => void
  isSelected: (id: string) => boolean
}

export const useCompare = create<CompareState>((set, get) => ({
  selectedIds: [],

  toggle: (id: string) => {
    const current = get().selectedIds
    if (current.includes(id)) {
      set({ selectedIds: current.filter((i) => i !== id) })
    } else if (current.length < 6) {
      set({ selectedIds: [...current, id] })
    }
  },

  clear: () => set({ selectedIds: [] }),

  isSelected: (id: string) => get().selectedIds.includes(id),
}))
