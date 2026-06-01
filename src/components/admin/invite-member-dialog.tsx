'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { useStores, useCreateStore } from '@/hooks/use-stores'
import { useCreateInvite } from '@/hooks/use-invites'
import { ROLE_LABELS } from '@/lib/constants'
import type { Role } from '@/types/user'

const NEW_STORE = '__new__'

/**
 * 發送 Email 邀請（P4-Auth）。
 * - Owner：可選任意店 + 角色 manager/employee；店別可選「+ 建立新店」內嵌建店。
 * - 店長：店別鎖自己店、角色鎖 employee（UI 鎖只是 UX，安全靠 DB RPC）。
 */
export function InviteMemberDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const profile = useAuth((s) => s.profile)
  const isOwner = profile?.role_key === 'owner'
  const stores = useStores()
  const createStore = useCreateStore()
  const createInvite = useCreateInvite()

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<Exclude<Role, 'owner'>>(isOwner ? 'manager' : 'employee')
  const [storeId, setStoreId] = useState<string>(isOwner ? '' : (profile?.store_id ?? ''))
  // 新店欄位（僅 Owner 選 NEW_STORE 時用）
  const [newName, setNewName] = useState('')
  const [newCode, setNewCode] = useState('')
  const [newRegion, setNewRegion] = useState('')

  const creatingNewStore = isOwner && storeId === NEW_STORE
  const submitting = createInvite.isPending || createStore.isPending

  const reset = () => {
    setEmail(''); setFullName(''); setRole(isOwner ? 'manager' : 'employee')
    setStoreId(isOwner ? '' : (profile?.store_id ?? ''))
    setNewName(''); setNewCode(''); setNewRegion('')
  }

  const close = () => { reset(); onClose() }

  const canSubmit = (() => {
    if (!email.trim() || email.indexOf('@') < 0) return false
    if (creatingNewStore) return newName.trim().length > 0
    return !!storeId
  })()

  const handleSubmit = async () => {
    if (!canSubmit) return
    try {
      let targetStoreId = storeId
      if (creatingNewStore) {
        const store = await createStore.mutateAsync({
          name: newName.trim(),
          code: newCode.trim() || newName.trim(),
          region: newRegion.trim() || null,
        })
        targetStoreId = store.id
      }
      await createInvite.mutateAsync({
        email: email.trim(),
        storeId: targetStoreId,
        role: isOwner ? role : 'employee',
        fullName: fullName,
      })
      close()
    } catch {
      // hook onError 已 toast。
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>邀請成員</DialogTitle>
          <DialogDescription>
            填入對方的 Google 帳號 Email，對方用該帳號登入即自動加入。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Google Email *</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="someone@gmail.com"
              maxLength={320}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invite-name">姓名（選填）</Label>
            <Input
              id="invite-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="對方加入時可自行修改"
              maxLength={50}
            />
          </div>

          {/* 角色：Owner 可選 manager/employee；店長鎖 employee */}
          <div className="space-y-1.5">
            <Label>角色</Label>
            {isOwner ? (
              <Select value={role} onValueChange={(v) => setRole(v as Exclude<Role, 'owner'>)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">{ROLE_LABELS.manager}</SelectItem>
                  <SelectItem value="employee">{ROLE_LABELS.employee}</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input value={ROLE_LABELS.employee} readOnly disabled />
            )}
          </div>

          {/* 店別：Owner 可選全部 + 建新店；店長鎖自己店 */}
          <div className="space-y-1.5">
            <Label>所屬店別</Label>
            {isOwner ? (
              <Select value={storeId} onValueChange={(v) => setStoreId(v ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="選擇店別" />
                </SelectTrigger>
                <SelectContent>
                  {(stores.data ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}（{s.code}）
                    </SelectItem>
                  ))}
                  <SelectItem value={NEW_STORE}>+ 建立新店</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={stores.data?.find((s) => s.id === profile?.store_id)?.name ?? '本店'}
                readOnly
                disabled
              />
            )}
          </div>

          {creatingNewStore && (
            <div className="space-y-3 rounded-md border border-dashed p-3">
              <p className="text-xs text-muted-foreground">建立新店並把此人指派為店長。</p>
              <div className="space-y-1.5">
                <Label htmlFor="new-store-name">店名 *</Label>
                <Input id="new-store-name" value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="例：青埔國小新生加盟店" maxLength={80} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="new-store-code">店號（選填）</Label>
                  <Input id="new-store-code" value={newCode} onChange={(e) => setNewCode(e.target.value)}
                    placeholder="例：BA119" maxLength={20} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-store-region">地區（選填）</Label>
                  <Input id="new-store-region" value={newRegion} onChange={(e) => setNewRegion(e.target.value)}
                    placeholder="例：桃園" maxLength={20} />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={submitting}>取消</Button>
          <Button onClick={handleSubmit} disabled={submitting || !canSubmit}>
            {submitting ? '送出中…' : '送出邀請'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
