/**
 * 使用者與租戶型別 — 對齊 P0 多租戶 schema
 * （supabase/migrations/20260522100002_tenancy.sql）。
 * 欄位名與資料庫一致（如 created_at，非舊版的 created_at_source）。
 */

/** 三層委派角色。對應 roles.key（owner / manager / employee）。 */
export type Role = 'owner' | 'manager' | 'employee'

/** 啟用 / 停用狀態。stores.status 與 profiles.status 共用同一組值。 */
export type AccountStatus = 'active' | 'suspended'

/** 註冊申請狀態。對應 registration_requests.status。 */
export type RegistrationStatus = 'pending' | 'approved' | 'rejected'

/** 店。對應 public.stores。 */
export interface Store {
  id: string
  name: string
  code: string
  region: string | null
  status: AccountStatus
  created_at: string
  updated_at: string
}

/**
 * 使用者（延伸 auth.users）。對應 public.profiles。
 * profile 存在 == 已被店長/Owner 核准；尚未核准者沒有 profile，只有 auth session。
 */
export interface Profile {
  id: string
  store_id: string | null
  role_key: Role
  full_name: string
  email: string
  phone_ext: string | null
  status: AccountStatus
  created_at: string
  updated_at: string
}

/** 能力登記表一列。對應 public.permissions。 */
export interface Permission {
  key: string
  name: string
  group_name: string
}

/**
 * 註冊申請。對應 public.registration_requests。
 * 2026-05-27 升級：store_id 改 nullable；新增 proposed_store_* 讓申請人提案新店，admin approve 時可建立成正式 stores。
 */
export interface RegistrationRequest {
  id: string
  auth_user_id: string
  email: string
  full_name: string
  phone_ext: string | null
  store_id: string | null
  proposed_store_name: string | null
  proposed_store_code: string | null
  proposed_store_region: string | null
  status: RegistrationStatus
  reviewed_by: string | null
  reviewed_at: string | null
  reject_reason: string | null
  created_at: string
}
