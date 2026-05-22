'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  usePermissions,
  useRolePermissions,
  useProfilePermissionGrants,
  useSetPermissionGrant,
} from '@/hooks/use-permissions'
import { PERMISSION_LABELS } from '@/lib/constants'
import type { Profile } from '@/types/user'

/**
 * 成員個別權限編輯。每個權限可選「沿用角色預設 / 強制開啟 / 強制關閉」，
 * 對應 profile_permission_grants 的「無 grant / granted=true / granted=false」。
 * 店長授予受 P0 trigger 上限保護，超出時 mutation 會回錯誤 toast。
 */
export function MemberPermissionDialog({
  member,
  onClose,
}: {
  member: Profile | null
  onClose: () => void
}) {
  const permissions = usePermissions()
  const rolePerms = useRolePermissions()
  const grants = useProfilePermissionGrants(member?.id ?? null)
  const setGrant = useSetPermissionGrant()

  const roleDefaults = new Set(
    (rolePerms.data ?? [])
      .filter((rp) => rp.role_key === member?.role_key)
      .map((rp) => rp.permission_key),
  )
  const grantMap = new Map((grants.data ?? []).map((g) => [g.permission_key, g.granted]))

  const stateOf = (key: string): 'default' | 'on' | 'off' => {
    if (!grantMap.has(key)) return 'default'
    return grantMap.get(key) ? 'on' : 'off'
  }

  const handleChange = (key: string, value: string) => {
    if (!member) return
    const granted = value === 'on' ? true : value === 'off' ? false : null
    setGrant.mutate({ profileId: member.id, permissionKey: key, granted })
  }

  return (
    <Dialog open={!!member} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>權限設定</DialogTitle>
          <DialogDescription>
            {member?.full_name} — 個別權限可覆蓋角色預設
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {(permissions.data ?? []).map((p) => {
            const isDefault = roleDefaults.has(p.key)
            return (
              <div
                key={p.key}
                className="flex items-center justify-between gap-2 rounded-md border p-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{PERMISSION_LABELS[p.key] ?? p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.group_name} · 角色預設：{isDefault ? '開啟' : '關閉'}
                  </p>
                </div>
                <Select
                  value={stateOf(p.key)}
                  onValueChange={(v) => handleChange(p.key, v ?? 'default')}
                >
                  <SelectTrigger size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">沿用預設</SelectItem>
                    <SelectItem value="on">強制開啟</SelectItem>
                    <SelectItem value="off">強制關閉</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
