'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ScrapeRequestWithRun } from '@/types/scrape'

/**
 * 當前店的爬取下單清單 + 嵌入對應 scrape_run 狀態。
 * RLS 已限自家店（scrape_requests SELECT policy）；scrape_runs 經 FK `run_id` 嵌入。
 * 狀態追蹤頁用，輪詢更新（refetchInterval）讓 waiting → fulfilled 即時反映。
 */
export function useScrapeRequests() {
  return useQuery({
    queryKey: ['scrape-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scrape_requests')
        .select('*, run:scrape_runs(*)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as ScrapeRequestWithRun[]
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  })
}
