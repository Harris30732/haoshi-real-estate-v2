/**
 * 爬取（謄本下單）型別 — 對齊 P0 多租戶 schema
 * （supabase/migrations/20260522100003_community_scraping.sql）。
 * 欄位名與資料庫一致；狀態 union 對齊各表的 CHECK 約束字串值。
 */

/** 下單請求狀態。對應 scrape_requests.status CHECK 約束。 */
export type ScrapeRequestStatus =
  | 'queued' // 剛建立、尚未掛上 run
  | 'waiting' // 已掛 run、等待爬取完成
  | 'fulfilled' // run 已 PASS、社區授權完成
  | 'deduped' // 命中新鮮資料、直接授權（零成本）
  | 'failed' // 下單失敗

/** 爬取 run 狀態。對應 scrape_runs.status CHECK 約束。 */
export type ScrapeRunStatus =
  | 'pending' // 等待 orchestrator 認領
  | 'scanning' // 階段A 盤面掃描中
  | 'scraping' // 階段B PDF 抓取中
  | 'passed' // 完整性閘門通過
  | 'incomplete' // 部分完成（隔天自動重試）
  | 'failed' // 失敗

/** run 內單筆物件的覆蓋狀態。對應 scrape_run_items.coverage_status。 */
export type CoverageStatus = 'observed' | 'skipped' | 'scraping' | 'covered' | 'failed'

/** 某店「我要這個社區」的下單請求。對應 public.scrape_requests。 */
export interface ScrapeRequest {
  id: string
  store_id: string
  requested_by: string
  community_id: string
  community_name_input: string
  run_id: string | null
  status: ScrapeRequestStatus
  created_at: string
  updated_at: string
}

/** 對一個社區的一次完整爬取嘗試。對應 public.scrape_runs。 */
export interface ScrapeRun {
  id: string
  community_id: string
  status: ScrapeRunStatus
  displayed_count: number | null
  covered_count: number | null
  initiated_by_store: string | null
  claimed_by: string | null
  claimed_at: string | null
  data_snapshot_at: string | null
  fail_reason: string | null
  started_at: string | null
  finished_at: string | null
  created_at: string
  updated_at: string
}

/** run 盤面上的一個物件。對應 public.scrape_run_items。 */
export interface ScrapeRunItem {
  id: string
  run_id: string
  ycut_object_key: string
  observed_owner_name: string | null
  observed_source_updated_at: string | null
  coverage_status: CoverageStatus
  transcript_id: string | null
  fail_reason: string | null
  created_at: string
  updated_at: string
}

/** 下單請求 + 其爬取 run（狀態追蹤頁用；run 經 FK 嵌入查詢取得）。 */
export interface ScrapeRequestWithRun extends ScrapeRequest {
  run: ScrapeRun | null
}

/** 店 YCUT 憑證設定狀態（get_store_credential_status RPC 回傳；不含密文）。 */
export interface StoreCredentialStatus {
  configured: boolean
  needs_refresh: boolean
  ycut_username: string | null
  rotated_at: string | null
}
