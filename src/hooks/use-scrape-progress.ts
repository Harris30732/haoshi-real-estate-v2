'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CoverageStatus } from '@/types/scrape'

/** 單一 run 的逐戶解析進度彙總（由 scrape_run_items.coverage_status 即時算出）。 */
export interface RunProgress {
  itemTotal: number // 已盤點戶數（scrape_run_items 總筆數）
  covered: number // 已完成（covered 解析成功 + skipped 已是最新免抓）
  failed: number // 失敗戶（僅 Owner 顯示）
  remaining: number // 待解析（scraping / observed）
}

const EMPTY: RunProgress = { itemTotal: 0, covered: 0, failed: 0, remaining: 0 }

/**
 * 針對「進行中」的 run 逐戶統計即時解析進度。
 *
 * 為什麼不直接讀 scrape_runs 的數字：`displayed_count` 只在盤面掃描結束（record_scan_results）
 * 落定、`covered_count` 只在 finalize 落定，兩者都無法反映 Phase B「正在一戶一戶寫」的即時進度。
 * 逐戶 coverage_status 才是跑條的真實來源。RLS 已限發起店 + Owner 可讀（scrape_run_items_select）。
 *
 * 僅在有進行中的 run 時才輪詢（runIds 非空才 enabled），閒置時不打 DB。
 */
export function useScrapeRunProgress(runIds: string[]) {
  const key = [...runIds].sort().join(',')
  return useQuery({
    queryKey: ['scrape-run-progress', key],
    enabled: runIds.length > 0,
    queryFn: async (): Promise<Record<string, RunProgress>> => {
      const { data, error } = await supabase
        .from('scrape_run_items')
        .select('run_id, coverage_status')
        .in('run_id', runIds)
      if (error) throw error

      const rows = (data ?? []) as { run_id: string; coverage_status: CoverageStatus }[]
      const acc: Record<string, RunProgress> = {}
      for (const row of rows) {
        const p = acc[row.run_id] ?? { ...EMPTY }
        p.itemTotal += 1
        if (row.coverage_status === 'covered' || row.coverage_status === 'skipped') {
          p.covered += 1
        } else if (row.coverage_status === 'failed') {
          p.failed += 1
        } else {
          // scraping / observed：仍待解析
          p.remaining += 1
        }
        acc[row.run_id] = p
      }
      return acc
    },
    // 跑條要有「在動」的感覺 → 比下單清單（15s）更密集輪詢
    refetchInterval: 5_000,
    staleTime: 3_000,
  })
}
