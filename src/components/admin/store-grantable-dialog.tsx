'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { usePermissions } from '@/hooks/use-permissions'
import { useManagerGrantable, useSetManagerGrantable } from '@/hooks/use-stores'
import { PERMISSION_LABELS } from '@/lib/constants'
import type { Store } from '@/types/user'

/**
 * Owner 設定某店「店長可轉授給員工的權限上限」。
 * 對應 manager_grantable_permissions；P0 trigger 以此上限卡死店長授權。
 */
export function StoreGrantableDialog({
  store,
  onClose,
}: {
  store: Store | null
  onClose: () => void
}) {
  const permissions = usePermissions()
  const grantable = useManagerGrantable(store?.id ?? null)
  const setGrantable = useSetManagerGrantable()
  const grantableSet = new Set(grantable.data ?? [])

  return (
    <Dialog open={!!store} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>店長可授予的權限</DialogTitle>
          <DialogDescription>
            {store?.name} — 勾選店長可轉授給員工的權限
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {(permissions.data ?? []).map((p) => (
            <label
              key={p.key}
              className="flex items-center gap-2 rounded-md border p-2 text-sm"
            >
              <Checkbox
                checked={grantableSet.has(p.key)}
                onCheckedChange={(checked) => {
                  if (!store) return
                  setGrantable.mutate({
                    storeId: store.id,
                    permissionKey: p.key,
                    enabled: checked === true,
                  })
                }}
              />
              <span>{PERMISSION_LABELS[p.key] ?? p.name}</span>
              <span className="text-xs text-muted-foreground">（{p.group_name}）</span>
            </label>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
