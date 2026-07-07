'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AccountStatus, Role } from '@/types/user'
import toast from 'react-hot-toast'

/**
 * 成員 profile 的後台變更。寫入受 P0 trigger `enforce_profile_field_protection`
 * 保護：store_id / role_key / status 僅 Owner 或該店店長可改。
 */

/** 停用 / 啟用成員。 */
export function useUpdateProfileStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { profileId: string; status: AccountStatus }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ status: v.status })
        .eq('id', v.profileId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['store-members'] })
      toast.success('已更新成員狀態')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : '更新失敗'),
  })
}

/** 變更成員角色（UI 應僅開放給 Owner）。 */
export function useUpdateProfileRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { profileId: string; role: Role }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role_key: v.role })
        .eq('id', v.profileId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['store-members'] })
      toast.success('已更新成員角色')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : '更新失敗'),
  })
}
