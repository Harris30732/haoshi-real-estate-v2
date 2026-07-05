'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ScrapeRunStatus } from '@/types/scrape'

/**
 * `scrape_dashboard_summary()` RPC 回傳結構（SECURITY INVOKER，照 RLS 各看各的）。
 * 欄位對齊 DB 已部署的合約（勿改）；`runs`/`requests` 內為聚合桶（bucket）計數，
 * 非逐筆狀態。`fail_breakdown_14d` 為近 14 天失敗分類統計。
 */
export interface ScrapeDashboardSummary {
  communities: {
    total: number
    with_data: number
    attempted: number
    never_attempted: number
  }
  runs: {
    passed: number
    failed: number
    incomplete: number
    in_progress: number
    pending: number
  }
  requests: {
    waiting: number
    fulfilled: number
    failed: number
    deduped: number
    queued: number
  }
  today: {
    attempted: number
    passed: number
    failed: number
    transcripts_added: number
  }
  fail_breakdown_14d: { kind: string; n: number }[]
  transcripts_total: number
  generated_at: string
}

/**
 * 爬取任務總覽摘要。單一 RPC 一次拿齊社區涵蓋/任務結果/匯入請求/今日/失敗分類。
 * 比即時狀態欄稀疏 → 30s 輪詢（即時逐戶進度另由 ScrapeStatusBar 5s/15s 負責）。
 */
export function useScrapeDashboardSummary() {
  return useQuery({
    queryKey: ['scrape-dashboard-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('scrape_dashboard_summary')
      if (error) throw error
      return data as ScrapeDashboardSummary
    },
    staleTime: 20_000,
    refetchInterval: 30_000,
  })
}

/** 任務紀錄表分頁大小（每頁 20 筆）。 */
export const RUN_LOG_PAGE_SIZE = 20

/** 狀態篩選值：'all' 或某個 run 狀態。 */
export type RunLogStatusFilter = 'all' | ScrapeRunStatus

/** 任務紀錄表一列（scrape_runs 直查 + 嵌 communities(name)）。 */
export interface ScrapeRunLogRow {
  id: string
  community_id: string
  status: ScrapeRunStatus
  displayed_count: number | null
  covered_count: number | null
  fail_reason: string | null
  started_at: string | null
  finished_at: string | null
  created_at: string
  updated_at: string
  community: { name: string | null } | null
}

interface RunLogParams {
  status: RunLogStatusFilter
  search: string
  page: number
}

/** scrape_runs 直查用的欄位（含嵌 communities(name)）；兩個 hook 共用避免漂移。 */
const RUN_LOG_SELECT =
  'id, community_id, status, displayed_count, covered_count, fail_reason, started_at, finished_at, created_at, updated_at, community:communities(name)'

/**
 * 由社區名模糊搜（已 trim）解析出符合的 community_id 清單。
 * 空字串 → 回 'ALL'（不需以社區篩選）；有搜但無符合 → 回 []（呼叫端回空避免 in([]) 誤查全表）。
 * ilike 前先跳脫 PostgREST 的 `%`（萬用字元）與 `,`（值分隔符），避免查詢跑掉或出錯。
 */
async function resolveCommunityIdsBySearch(
  trimmedSearch: string,
): Promise<string[] | 'ALL'> {
  if (!trimmedSearch) return 'ALL'
  const escaped = trimmedSearch.replace(/[%,]/g, '\\$&')
  const { data, error } = await supabase
    .from('communities')
    .select('id')
    .ilike('name', `%${escaped}%`)
  if (error) throw error
  return (data ?? []).map((c) => c.id as string)
}

/**
 * 任務紀錄表：直查 scrape_runs，依 status 篩選、community name 模糊搜、分頁。
 * RLS 已限自家可見範圍（scrape_runs SELECT policy）。仿 use-scrape-requests 的直查風格。
 * 社區名模糊搜：先以 name ilike 查出符合的 community_id，再以 in 篩 runs
 * （PostgREST 無法直接對嵌入表欄位做 filter）。
 */
export function useScrapeRunLog({ status, search, page }: RunLogParams) {
  const q = search.trim()
  return useQuery({
    queryKey: ['scrape-run-log', { status, search: q, page }],
    queryFn: async () => {
      const resolved = await resolveCommunityIdsBySearch(q)
      // 搜尋無任何符合社區 → 直接回空，避免下面 in([]) 誤查全表
      if (resolved !== 'ALL' && resolved.length === 0) {
        return { rows: [] as ScrapeRunLogRow[], total: 0 }
      }

      const from = page * RUN_LOG_PAGE_SIZE
      const to = from + RUN_LOG_PAGE_SIZE - 1

      let query = supabase
        .from('scrape_runs')
        .select(RUN_LOG_SELECT, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)
      if (status !== 'all') query = query.eq('status', status)
      if (resolved !== 'ALL') query = query.in('community_id', resolved)

      const { data, error, count } = await query
      if (error) throw error
      return {
        rows: (data ?? []) as unknown as ScrapeRunLogRow[],
        total: count ?? 0,
      }
    },
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    refetchInterval: 30_000,
  })
}

/**
 * 匯出用：一次撈全部 runs（不分頁），套用同樣的 status/search 條件。
 * 上限 1000 筆（PostgREST 單次上限），足夠涵蓋目前規模。enabled 由呼叫端控制以避免自動查。
 */
export function useAllScrapeRunsForExport(
  { status, search }: { status: RunLogStatusFilter; search: string },
  enabled: boolean,
) {
  const q = search.trim()
  return useQuery({
    queryKey: ['scrape-run-log-export', { status, search: q }],
    queryFn: async () => {
      const resolved = await resolveCommunityIdsBySearch(q)
      if (resolved !== 'ALL' && resolved.length === 0) return [] as ScrapeRunLogRow[]

      let query = supabase
        .from('scrape_runs')
        .select(RUN_LOG_SELECT)
        .order('created_at', { ascending: false })
        .range(0, 999)
      if (status !== 'all') query = query.eq('status', status)
      if (resolved !== 'ALL') query = query.in('community_id', resolved)

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as unknown as ScrapeRunLogRow[]
    },
    enabled,
    staleTime: 0,
  })
}
