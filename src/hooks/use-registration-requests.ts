'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import type { RegistrationRequest, Role } from '@/types/user'
import toast from 'react-hot-toast'

/** 後台用：待審核申請；依 RLS，Owner 看全部、店長看自店。 */
export function useRegistrationRequests() {
  return useQuery({
    queryKey: ['registration-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registration_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as RegistrationRequest[]
    },
    staleTime: 30_000,
  })
}

/** 申請人本人最新一筆申請（register / pending 頁導向判斷用）。 */
export function useMyRegistrationRequest() {
  const authUserId = useAuth((s) => s.authUserId)
  return useQuery({
    queryKey: ['my-registration-request', authUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registration_requests')
        .select('*')
        .eq('auth_user_id', authUserId as string)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return (data as RegistrationRequest | null) ?? null
    },
    enabled: !!authUserId,
    staleTime: 30_000,
  })
}

/**
 * 送出註冊申請。兩種模式：
 *   (a) existing-store：傳 storeId（從下拉選擇既有店）
 *   (b) new-store：傳 proposedStoreName / proposedStoreCode（自填新店資訊，admin 核准時可建立成正式店）
 */
export function useSubmitRegistration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      storeId?: string | null
      proposedStoreName?: string | null
      proposedStoreCode?: string | null
      proposedStoreRegion?: string | null
      fullName: string
      email: string
      phoneExt: string | null
    }) => {
      const authUserId = useAuth.getState().authUserId
      if (!authUserId) throw new Error('尚未登入，請先用 Google 登入')
      const trimOrNull = (v?: string | null) => {
        const t = (v ?? '').trim()
        return t.length > 0 ? t : null
      }
      const storeId = input.storeId || null
      const proposedName = trimOrNull(input.proposedStoreName)
      if (!storeId && !proposedName) {
        throw new Error('請選擇所屬店，或填寫新店資訊')
      }
      const { data, error } = await supabase
        .from('registration_requests')
        .insert({
          auth_user_id: authUserId,
          store_id: storeId,
          proposed_store_name: proposedName,
          proposed_store_code: trimOrNull(input.proposedStoreCode),
          proposed_store_region: trimOrNull(input.proposedStoreRegion),
          full_name: input.fullName,
          email: input.email,
          phone_ext: input.phoneExt,
          status: 'pending',
        })
        .select()
        .single()
      if (error) throw error
      return data as RegistrationRequest
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-registration-request'] })
      toast.success('申請已送出，等待審核')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : '送出失敗'),
  })
}

/**
 * 核准申請 — 用 approve_registration_v2 RPC，DB 驗角色 + 三種模式：
 *   (a) 直接套用申請人選的店（store_id, create_store_name 都不傳）
 *   (b) admin 改派既有店（傳 storeId）
 *   (c) admin 建立新店並指派（傳 createStoreName + code/region；僅 Owner 可）
 */
export function useApproveRegistration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: {
      requestId: string
      role: Role
      storeId?: string | null               // (b) override 既有店
      createStoreName?: string | null       // (c) 建立新店
      createStoreCode?: string | null
      createStoreRegion?: string | null
    }) => {
      const trimOrNull = (s?: string | null) => {
        const t = (s ?? '').trim()
        return t.length > 0 ? t : null
      }
      const { error } = await supabase.rpc('approve_registration_v2', {
        p_request_id: v.requestId,
        p_role_key: v.role,
        p_store_id: v.storeId || null,
        p_create_store_name: trimOrNull(v.createStoreName),
        p_create_store_code: trimOrNull(v.createStoreCode),
        p_create_store_region: trimOrNull(v.createStoreRegion),
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['registration-requests'] })
      qc.invalidateQueries({ queryKey: ['store-members'] })
      qc.invalidateQueries({ queryKey: ['stores'] })  // 新店建立後刷新店清單
      toast.success('已核准申請')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : '核准失敗'),
  })
}

/** 駁回申請（UPDATE status=rejected；RLS 限 Owner / 該店店長）。 */
export function useRejectRegistration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { requestId: string; reason: string }) => {
      const reviewerId = useAuth.getState().profile?.id
      const { error } = await supabase
        .from('registration_requests')
        .update({
          status: 'rejected',
          reject_reason: v.reason,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', v.requestId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['registration-requests'] })
      toast.success('已駁回申請')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : '駁回失敗'),
  })
}
