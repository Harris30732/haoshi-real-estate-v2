import type { Role, AccountStatus } from '@/types/user'
import type { ScrapeRequestStatus, ScrapeRunStatus } from '@/types/scrape'

export const APP_NAME = '好市房產'

export const API_BASE = '/api'

export const ENDPOINTS = {
  ALL_DATA: '/all-data',
  PROPERTIES: '/admin/properties',
  COMMUNITIES: '/admin/communities',
  PHOTOS: '/admin/photos/upload',
} as const

export const PROPERTY_STATUS = {
  FOR_SALE: '在售',
  DELISTED: '已下架',
  SOLD: '已成交',
} as const

export const CONTRACT_TYPES = {
  EXCLUSIVE: '專任',
  GENERAL: '一般',
  OWNER: '屋主',
  PENDING: '待確認',
} as const

export const LAYOUT_TYPES = [
  '套房', '兩房', '三房', '三房+1房', '四房', '四房以上',
] as const

// ==================== 多租戶角色 / 權限 / 狀態 ====================
// 鍵值對齊 P0 schema seed（supabase/migrations/20260522100007_seed.sql）。

export const ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
} as const

export const ROLE_LABELS: Record<Role, string> = {
  owner: '系統擁有者',
  manager: '店長',
  employee: '員工',
}

export const PERMISSIONS = {
  SCRAPE_SUBMIT: 'scrape.submit',
  TRANSCRIPTS_VIEW: 'transcripts.view',
  COMMUNITIES_VIEW: 'communities.view',
  STORE_MANAGE_MEMBERS: 'store.manage_members',
  STORE_MANAGE_CREDENTIALS: 'store.manage_credentials',
  BILLING_VIEW: 'billing.view',
} as const

export const PERMISSION_LABELS: Record<string, string> = {
  'scrape.submit': '送出謄本爬取',
  'transcripts.view': '瀏覽謄本資料',
  'communities.view': '瀏覽社區',
  'store.manage_members': '管理店內成員',
  'store.manage_credentials': '設定店 YCUT 憑證',
  'billing.view': '檢視計價與用量',
}

export const PROFILE_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
} as const

export const PROFILE_STATUS_LABELS: Record<AccountStatus, string> = {
  active: '啟用',
  suspended: '停用',
}

// ==================== 謄本爬取狀態 ====================
// 鍵值對齊 P0 schema 各表 CHECK 約束（20260522100003_community_scraping.sql）。

export const SCRAPE_REQUEST_STATUS = {
  QUEUED: 'queued',
  WAITING: 'waiting',
  FULFILLED: 'fulfilled',
  DEDUPED: 'deduped',
  FAILED: 'failed',
} as const

export const SCRAPE_REQUEST_STATUS_LABELS: Record<ScrapeRequestStatus, string> = {
  queued: '排隊中',
  waiting: '爬取中',
  fulfilled: '完成',
  deduped: '已共享',
  failed: '失敗',
}

export const SCRAPE_RUN_STATUS = {
  PENDING: 'pending',
  SCANNING: 'scanning',
  SCRAPING: 'scraping',
  PASSED: 'passed',
  INCOMPLETE: 'incomplete',
  FAILED: 'failed',
} as const

export const SCRAPE_RUN_STATUS_LABELS: Record<ScrapeRunStatus, string> = {
  pending: '等待認領',
  scanning: '盤面掃描中',
  scraping: '抓取中',
  passed: '完成',
  incomplete: '部分完成',
  failed: '失敗',
}

export const PRICE_RANGES = [
  { label: '1000萬以下', min: 0, max: 1000 },
  { label: '1000-1500萬', min: 1000, max: 1500 },
  { label: '1500-2000萬', min: 1500, max: 2000 },
  { label: '2000-2500萬', min: 2000, max: 2500 },
  { label: '2500-3000萬', min: 2500, max: 3000 },
  { label: '3000萬以上', min: 3000, max: Infinity },
] as const

export const ITEMS_PER_PAGE = 20
