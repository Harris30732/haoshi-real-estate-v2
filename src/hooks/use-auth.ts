'use client'

import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/user'

/**
 * 認證狀態機（架構：純 client-side，安全邊界靠 P0 RLS）：
 * - anon      : 無 Supabase session（未登入）
 * - pending   : 有 session 但 profiles 查無此人（已 Google 登入、尚未被店長核准）
 * - active    : 有 profile 且 status === 'active'
 * - suspended : 有 profile 但 status === 'suspended'（被停用）
 */
export type AuthState = 'anon' | 'pending' | 'active' | 'suspended'

interface AuthStore {
  authState: AuthState
  profile: Profile | null
  /** Supabase auth.users.id —— pending 使用者（尚無 profile）送註冊申請時需要。 */
  authUserId: string | null
  /** Google 帶回的 email / 顯示名，供註冊表單預填。 */
  authEmail: string | null
  authName: string | null
  isLoading: boolean
  loginWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

/** 由 session + profile 推導狀態機。 */
function deriveAuthState(session: Session | null, profile: Profile | null): AuthState {
  if (!session) return 'anon'
  if (!profile) return 'pending'
  return profile.status === 'suspended' ? 'suspended' : 'active'
}

export const useAuth = create<AuthStore>((set) => ({
  authState: 'anon',
  profile: null,
  authUserId: null,
  authEmail: null,
  authName: null,
  isLoading: true,

  loginWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/login` },
    })
    if (error) {
      console.error('Google 登入啟動失敗:', error)
      throw new Error('Google 登入失敗，請稍後再試')
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('登出失敗:', error)
    set({
      authState: 'anon',
      profile: null,
      authUserId: null,
      authEmail: null,
      authName: null,
      isLoading: false,
    })
  },
}))

/**
 * 依 session 查 profiles 並更新 store。
 * 必須在 onAuthStateChange callback 之外執行 —— 在 callback 內直接 await
 * supabase 查詢會觸發 supabase-js 的 lock 死結（官方已知 bug）。
 */
async function syncProfile(session: Session | null) {
  if (!session) {
    useAuth.setState({
      authState: 'anon',
      profile: null,
      authUserId: null,
      authEmail: null,
      authName: null,
      isLoading: false,
    })
    return
  }
  const meta = session.user.user_metadata ?? {}
  const authName = (meta.full_name as string | undefined) ?? (meta.name as string | undefined) ?? null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, store_id, role_key, full_name, email, phone_ext, status, created_at, updated_at')
    .eq('id', session.user.id)
    .maybeSingle()
  if (error) {
    console.error('讀取使用者 profile 失敗:', error)
  }
  const profile = (data as Profile | null) ?? null
  useAuth.setState({
    authState: deriveAuthState(session, profile),
    profile,
    authUserId: session.user.id,
    authEmail: session.user.email ?? null,
    authName,
    isLoading: false,
  })
}

declare global {
  var __haoshiAuthSubscribed: boolean | undefined
}

// client 端模組載入時訂閱一次 session 變化（含初次的 INITIAL_SESSION 事件）。
// callback 內不可直接 await supabase 查詢 → 用 setTimeout 把 syncProfile 推遲到
// callback 結束後執行，規避 supabase-js onAuthStateChange 的 lock 死結。
// globalThis 旗標：Next dev 的 Fast Refresh 會重新執行模組，防止重複訂閱
// （重複訂閱會讓每次 auth 事件觸發多次 syncProfile）。
if (typeof window !== 'undefined' && !globalThis.__haoshiAuthSubscribed) {
  globalThis.__haoshiAuthSubscribed = true
  supabase.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => {
      void syncProfile(session)
    }, 0)
  })
}
