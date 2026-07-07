'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { CostRate, SellRate } from '@/types/pricing'

/** 全域成本費率（現行；effective_to IS NULL）。RLS 限 Owner。 */
export function useCostRates() {
  return useQuery({
    queryKey: ['cost-rates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cost_rates')
        .select('*')
        .is('effective_to', null)
        .order('event_type', { ascending: true })
      if (error) throw error
      return (data ?? []) as CostRate[]
    },
    staleTime: 60_000,
  })
}

/** 設成本費率（close 現行 + insert 新；Owner only RPC）。 */
export function useSetCostRate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { event_type: string; unit_cost: number; note?: string | null }) => {
      const { error } = await supabase.rpc('set_cost_rate', {
        p_event_type: v.event_type,
        p_unit_cost: v.unit_cost,
        p_note: v.note ?? null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cost-rates'] })
      toast.success('成本費率已更新')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : '更新失敗'),
  })
}

/** 某店現行售價費率；storeId=null 表全域預設售價。 */
export function useStoreSellRates(storeId: string | null) {
  return useQuery({
    queryKey: ['sell-rates', storeId],
    queryFn: async () => {
      let q = supabase.from('sell_rates').select('*').is('effective_to', null)
      q = storeId ? q.eq('store_id', storeId) : q.is('store_id', null)
      const { data, error } = await q.order('event_type', { ascending: true })
      if (error) throw error
      return (data ?? []) as SellRate[]
    },
    staleTime: 60_000,
  })
}

/** 設某店售價（p_store_id=null 設全域預設；Owner only RPC）。 */
export function useSetStoreSellRate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: {
      store_id: string | null
      event_type: string
      unit_price: number
      note?: string | null
    }) => {
      const { error } = await supabase.rpc('set_store_sell_rate', {
        p_store_id: v.store_id,
        p_event_type: v.event_type,
        p_unit_price: v.unit_price,
        p_note: v.note ?? null,
      })
      if (error) throw error
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['sell-rates', v.store_id] })
      toast.success('售價已更新')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : '更新失敗'),
  })
}
