'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import type { StoreCredentialStatus } from '@/types/scrape'
import toast from 'react-hot-toast'

/**
 * 某店 YCUT 憑證的設定狀態（呼叫 `get_store_credential_status` RPC）。
 * RPC 為 SECURITY DEFINER、只回非密文欄位，且內部驗 Owner / 該店店長。
 */
export function useStoreCredentialStatus(storeId: string | null) {
  return useQuery({
    queryKey: ['store-credential-status', storeId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_store_credential_status', {
        p_store_id: storeId as string,
      })
      if (error) throw error
      // RETURNS TABLE → PostgREST 回傳陣列；function 保證恰一列。
      return ((data as StoreCredentialStatus[] | null)?.[0]) ?? null
    },
    enabled: !!storeId,
    staleTime: 30_000,
    // 驗證中每 5 秒輪詢，worker 驗完（通過/失敗）UI 自動更新三態
    refetchInterval: (query) =>
      query.state.data?.pending_validation ? 5_000 : false,
  })
}

/**
 * 設定 / 更新某店 YCUT 帳密（呼叫 P0 `set_store_ycut_credentials` RPC）。
 * 密碼經 RPC 內 pgp_sym_encrypt 加密寫入隔離表，前端永遠讀不回密文。
 */
export function useSetStoreCredentials() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { storeId: string; username: string; password: string }) => {
      const { error } = await supabase.rpc('set_store_ycut_credentials', {
        p_store_id: v.storeId,
        p_username: v.username,
        p_password: v.password,
      })
      if (error) throw error
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['store-credential-status', v.storeId] })
      toast.success('YCUT 憑證已更新')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : '設定失敗'),
  })
}

/**
 * 當前登入店長的店是否「YCUT 帳密不可用」（未設定或帳密異常）。
 * 用於：(1) 全站提示彈窗 [[ycut-credential-gate]]、(2) 擋下單。
 * 只針對店長（manager）—— Owner 走多店下拉設定、員工不設帳密，故不觸發。
 * needs 僅在 RPC 明確回報時為 true（loading/未知時不誤擋）。
 * reason 區分彈窗文案：'unconfigured'（從未設定）/ 'invalid'（驗證失敗，須重設）。
 * 注意：pending_validation（驗證中）不觸發彈窗 —— worker 約 30 秒內就會驗完。
 */
export function useNeedsYcutCredentials() {
  const profile = useAuth((s) => s.profile)
  const storeId = profile?.role_key === 'manager' ? (profile?.store_id ?? null) : null
  const status = useStoreCredentialStatus(storeId)
  const reason: 'unconfigured' | 'invalid' | null =
    !storeId || status.data == null ? null
    : !status.data.configured ? 'unconfigured'
    : status.data.needs_refresh ? 'invalid'
    : null
  return { needs: reason != null, reason, isLoading: status.isLoading, storeId }
}
