// P3 計價/帳務型別 + 標籤 + 格式 helper。
// 對齊 supabase/migrations/20260607100000_p3_pricing_billing.sql。

export type BillingEventType =
  | 'scrape_pdf'
  | 'scrape_html'
  | 'gemini_parse'
  | 'gemini_parse_failed'
  | 'dedup_grant'

/** 可設售價的 event_type（只對「交付謄本」收費；對齊 sell_rates CHECK）。 */
export type SellEventType = 'scrape_pdf' | 'scrape_html' | 'dedup_grant'

export const COST_EVENT_TYPES: BillingEventType[] = [
  'scrape_pdf',
  'scrape_html',
  'gemini_parse',
  'gemini_parse_failed',
  'dedup_grant',
]

export const SELL_EVENT_TYPES: SellEventType[] = ['scrape_pdf', 'scrape_html', 'dedup_grant']

export const BILLING_EVENT_LABELS: Record<BillingEventType, string> = {
  scrape_pdf: '一類謄本（PDF）',
  scrape_html: '二類謄本（HTML）',
  gemini_parse: 'Gemini 解析',
  gemini_parse_failed: 'Gemini 解析失敗',
  dedup_grant: '共享交付（去重）',
}

export interface CostRate {
  id: string
  event_type: BillingEventType
  unit_cost: number | string
  currency: string
  effective_from: string
  effective_to: string | null
  note: string | null
  created_at: string
}

export interface SellRate {
  id: string
  store_id: string | null
  event_type: SellEventType
  unit_price: number | string
  currency: string
  effective_from: string
  effective_to: string | null
  note: string | null
  created_at: string
}

/** preview_store_billing 回傳的一列。 */
export interface BillingLine {
  event_type: BillingEventType
  quantity: number | string
  unit_cost: number | string
  unit_price: number | string
  cost_subtotal: number | string
  sell_subtotal: number | string
  margin: number | string
}

export interface BillingStatement {
  id: string
  store_id: string
  period_year: number
  period_month: number
  currency: string
  total_cost: number | string
  total_sell: number | string
  total_margin: number | string
  status: string
  frozen_at: string
  frozen_by: string | null
}

/** overview_billing 回傳的一列。 */
export interface BillingOverviewRow {
  store_id: string
  store_name: string
  quantity_total: number | string
  cost_total: number | string
  sell_total: number | string
  margin_total: number | string
  is_frozen: boolean
}

/** 金額格式：NT$ 千分位，最多兩位小數。 */
export function fmtMoney(v: number | string | null | undefined): string {
  const n = Number(v ?? 0)
  if (!isFinite(n)) return 'NT$0'
  return 'NT$' + n.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export function fmtInt(v: number | string | null | undefined): string {
  return Number(v ?? 0).toLocaleString('zh-TW')
}
