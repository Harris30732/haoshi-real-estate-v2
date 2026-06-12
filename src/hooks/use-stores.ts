'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import type { Store } from '@/types/user'
import toast from 'react-hot-toast'

/** 註冊頁用：SECURITY DEFINER RPC，尚未核准的使用者也能取得啟用中店清單。 */
export function useStoresForRegistration() {
  return useQuery({
    queryKey: ['stores-for-registration'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_stores_for_registration')
      if (error) throw error
      return (data ?? []) as Pick<Store, 'id' | 'name' | 'code'>[]
    },
    staleTime: 300_000,
  })
}

/** 後台用：依 RLS，Owner 看全部、店長看自店。 */
export function useStores() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return (data ?? []) as Store[]
    },
    staleTime: 60_000,
  })
}

/** 當前登入者所屬店（RLS：成員可讀自店）。未綁店（如部分 Owner）回 null。 */
export function useMyStore() {
  const profile = useAuth((s) => s.profile)
  const storeId = profile?.store_id ?? null
  return useQuery({
    queryKey: ['my-store', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, code')
        .eq('id', storeId as string)
        .maybeSingle()
      if (error) throw error
      return (data ?? null) as Pick<Store, 'id' | 'name' | 'code'> | null
    },
    enabled: !!storeId,
    staleTime: 300_000,
  })
}

/** 建店（RLS 限 Owner）。 */
export function useCreateStore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string; code: string; region: string | null }) => {
      const { data, error } = await supabase
        .from('stores')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data as Store
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores'] })
      toast.success('店建立成功')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : '建立失敗'),
  })
}

/** 某店「店長可授予員工的權限」清單（permission key 陣列）。 */
export function useManagerGrantable(storeId: string | null) {
  return useQuery({
    queryKey: ['manager-grantable', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manager_grantable_permissions')
        .select('permission_key')
        .eq('store_id', storeId as string)
      if (error) throw error
      return (data ?? []).map((r) => r.permission_key as string)
    },
    enabled: !!storeId,
    staleTime: 60_000,
  })
}

/** Owner 調整某店店長可轉授的權限上限。 */
export function useSetManagerGrantable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { storeId: string; permissionKey: string; enabled: boolean }) => {
      if (v.enabled) {
        const { error } = await supabase
          .from('manager_grantable_permissions')
          .insert({ store_id: v.storeId, permission_key: v.permissionKey })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('manager_grantable_permissions')
          .delete()
          .eq('store_id', v.storeId)
          .eq('permission_key', v.permissionKey)
        if (error) throw error
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['manager-grantable', v.storeId] })
      toast.success('已更新店長可授予權限')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : '更新失敗'),
  })
}
