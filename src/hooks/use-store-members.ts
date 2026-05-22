'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/user'

/**
 * 後台成員清單。依 P0 RLS，Owner 看全部、店長看自店、員工看自己。
 * 角色 / 權限 / 停用等變更見 use-profile、use-permissions。
 */
export function useStoreMembers() {
  return useQuery({
    queryKey: ['store-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as Profile[]
    },
    staleTime: 60_000,
  })
}
