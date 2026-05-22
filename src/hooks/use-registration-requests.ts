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

/** 送出註冊申請（RLS：auth_user_id 必須等於 auth.uid()）。 */
export function useSubmitRegistration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      storeId: string
      fullName: string
      email: string
      phoneExt: string | null
    }) => {
      const authUserId = useAuth.getState().authUserId
      if (!authUserId) throw new Error('尚未登入，請先用 Google 登入')
      const { data, error } = await supabase
        .from('registration_requests')
        .insert({
          auth_user_id: authUserId,
          store_id: input.storeId,
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
      toast.success('申請已送出，等待店長審核')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : '送出失敗'),
  })
}

/** 核准申請（呼叫 approve_registration RPC，DB 端會驗角色權限）。 */
export function useApproveRegistration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { requestId: string; role: Role }) => {
      const { error } = await supabase.rpc('approve_registration', {
        p_request_id: v.requestId,
        p_role_key: v.role,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['registration-requests'] })
      qc.invalidateQueries({ queryKey: ['store-members'] })
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
