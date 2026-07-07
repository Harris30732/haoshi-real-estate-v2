'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import type { Invite, MyInvite, Role } from '@/types/user'
import toast from 'react-hot-toast'

/**
 * P4-Auth：Email 預先邀請。所有寫入走 SECURITY DEFINER RPC（invites 表對
 * authenticated 零 policy，前端不可直接 .from('invites')）。安全邊界全在 DB RPC。
 */

/** 當前登入者（pending 狀態）的 pending 邀請 — /register 顯示「您被邀請加入 X 店為 Y」。 */
export function useMyInvite() {
  const authState = useAuth((s) => s.authState)
  const authUserId = useAuth((s) => s.authUserId)
  return useQuery({
    queryKey: ['my-invite', authUserId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_invite')
      if (error) throw error
      const row = Array.isArray(data) ? data[0] : data
      return (row as MyInvite | undefined) ?? null
    },
    enabled: authState === 'pending' && !!authUserId,
    staleTime: 15_000,
  })
}

/**
 * 接受邀請 → 建 profile。成功後 refreshSession 重簽 JWT（拿到 app_role/store_id），
 * onAuthStateChange 會自動 re-sync profile → authState 變 active。
 */
export function useAcceptInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { fullName?: string | null }) => {
      const { error } = await supabase.rpc('accept_my_invite', {
        p_full_name: (v.fullName ?? '').trim() || null,
      })
      if (error) throw error
      // 重簽 JWT：此時 profile 已建立，新 token 才會帶 app_role/store_id。
      const { error: refreshErr } = await supabase.auth.refreshSession()
      if (refreshErr) throw refreshErr
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-invite'] })
      toast.success('已加入，歡迎使用系統')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : '加入失敗'),
  })
}

/** 待接受邀請清單（後台用）。DEFINER RPC 內做租戶過濾：Owner 全部、店長限自店。 */
export function useListInvites() {
  return useQuery({
    queryKey: ['invites'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_invites')
      if (error) throw error
      return (data ?? []) as Invite[]
    },
    staleTime: 30_000,
  })
}

/**
 * 建邀請。Owner 可邀任意店 manager/employee；店長限自己店 + employee（DB RPC 強制）。
 */
export function useCreateInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: {
      email: string
      storeId: string
      role: Exclude<Role, 'owner'>
      fullName?: string | null
    }) => {
      const { error } = await supabase.rpc('create_invite', {
        p_email: v.email.trim(),
        p_store_id: v.storeId,
        p_role_key: v.role,
        p_full_name: (v.fullName ?? '').trim() || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invites'] })
      toast.success('邀請已建立，請通知對方用該 Google 帳號登入')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : '建立邀請失敗'),
  })
}

/** 撤銷待接受邀請。 */
export function useRevokeInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase.rpc('revoke_invite', { p_invite_id: inviteId })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invites'] })
      toast.success('已撤銷邀請')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : '撤銷失敗'),
  })
}
