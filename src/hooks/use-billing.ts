'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { BillingLine, BillingOverviewRow, BillingStatement } from '@/types/pricing'

/** 即時試算某店某月（不寫入）。Owner only RPC。 */
export function usePreviewBilling(storeId: string | null, year: number, month: number) {
  return useQuery({
    queryKey: ['billing-preview', storeId, year, month],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('preview_store_billing', {
        p_store_id: storeId,
        p_year: year,
        p_month: month,
      })
      if (error) throw error
      return (data ?? []) as BillingLine[]
    },
    enabled: !!storeId,
    staleTime: 30_000,
  })
}

/** 跨店某月用量/成本/售價/毛利彙總。Owner only RPC。 */
export function useBillingOverview(year: number, month: number) {
  return useQuery({
    queryKey: ['billing-overview', year, month],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('overview_billing', { p_year: year, p_month: month })
      if (error) throw error
      return (data ?? []) as BillingOverviewRow[]
    },
    staleTime: 30_000,
  })
}

/** 已凍結帳單清單（可選店過濾）。Owner only RPC。 */
export function useStatements(storeId: string | null) {
  return useQuery({
    queryKey: ['billing-statements', storeId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_statements', { p_store_id: storeId })
      if (error) throw error
      return (data ?? []) as BillingStatement[]
    },
    staleTime: 30_000,
  })
}

/** 結帳凍結某店某月（冪等；月須已結束）。Owner only RPC。 */
export function useFreezeBilling() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { storeId: string; year: number; month: number }) => {
      const { data, error } = await supabase.rpc('freeze_store_billing', {
        p_store_id: v.storeId,
        p_year: v.year,
        p_month: v.month,
      })
      if (error) throw error
      return data as BillingStatement
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['billing-statements'] })
      qc.invalidateQueries({ queryKey: ['billing-overview', v.year, v.month] })
      toast.success('已結帳凍結')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : '結帳失敗'),
  })
}
