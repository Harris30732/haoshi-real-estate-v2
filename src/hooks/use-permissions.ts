'use client'

import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import type { Permission, Role } from '@/types/user'
import toast from 'react-hot-toast'

/** 權限目錄（permissions 表；RLS 對所有人開放讀）。 */
export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('group_name', { ascending: true })
      if (error) throw error
      return (data ?? []) as Permission[]
    },
    staleTime: 600_000,
  })
}

/** 角色預設權限（role_permissions 表）。 */
export function useRolePermissions() {
  return useQuery({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('role_key, permission_key')
      if (error) throw error
      return (data ?? []) as { role_key: Role; permission_key: string }[]
    },
    staleTime: 600_000,
  })
}

/** 某成員的個別權限加減（profile_permission_grants）。 */
export function useProfilePermissionGrants(profileId: string | null) {
  return useQuery({
    queryKey: ['profile-permission-grants', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_permission_grants')
        .select('permission_key, granted')
        .eq('profile_id', profileId as string)
      if (error) throw error
      return (data ?? []) as { permission_key: string; granted: boolean }[]
    },
    enabled: !!profileId,
    staleTime: 60_000,
  })
}

/**
 * 設定 / 移除成員個別權限。granted=null 表示移除 grant（回到角色預設）。
 * 店長授予受 P0 trigger `enforce_manager_grant_ceiling` 上限保護。
 */
export function useSetPermissionGrant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { profileId: string; permissionKey: string; granted: boolean | null }) => {
      if (v.granted === null) {
        const { error } = await supabase
          .from('profile_permission_grants')
          .delete()
          .eq('profile_id', v.profileId)
          .eq('permission_key', v.permissionKey)
        if (error) throw error
        return
      }
      const grantedBy = useAuth.getState().profile?.id
      if (!grantedBy) throw new Error('未登入')
      const { error } = await supabase
        .from('profile_permission_grants')
        .upsert(
          {
            profile_id: v.profileId,
            permission_key: v.permissionKey,
            granted: v.granted,
            granted_by: grantedBy,
          },
          { onConflict: 'profile_id,permission_key' },
        )
      if (error) throw error
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['profile-permission-grants', v.profileId] })
      toast.success('已更新權限')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : '更新失敗'),
  })
}

/**
 * 目前登入者的有效權限集合。鏡射 P0 `has_permission()`：
 * owner 全通過；否則角色預設 ± 個別 grant。供 sidebar / 條件渲染使用。
 * 註：這是 UX gating，真正的安全邊界是 DB 端 RLS。
 */
export function useMyPermissions(): Set<string> {
  const profile = useAuth((s) => s.profile)
  const { data: catalog } = usePermissions()
  const { data: rolePerms } = useRolePermissions()
  const { data: grants } = useProfilePermissionGrants(profile?.id ?? null)

  return useMemo(() => {
    const set = new Set<string>()
    if (!profile) return set
    if (profile.role_key === 'owner') {
      catalog?.forEach((p) => set.add(p.key))
      return set
    }
    rolePerms
      ?.filter((rp) => rp.role_key === profile.role_key)
      .forEach((rp) => set.add(rp.permission_key))
    grants?.forEach((g) => {
      if (g.granted) set.add(g.permission_key)
      else set.delete(g.permission_key)
    })
    return set
  }, [profile, catalog, rolePerms, grants])
}

/**
 * `useMyPermissions` 的就緒旗標 —— 三個底層權限 query 是否都已載入。
 * AuthGuard 的 requiredPermission gating 用它，避免「載入中誤判無權限」的閃爍。
 */
export function useMyPermissionsReady(): boolean {
  const profile = useAuth((s) => s.profile)
  const catalog = usePermissions()
  const rolePerms = useRolePermissions()
  const grants = useProfilePermissionGrants(profile?.id ?? null)
  return !catalog.isLoading && !rolePerms.isLoading && !grants.isLoading
}
