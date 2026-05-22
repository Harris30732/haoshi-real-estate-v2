'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
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
