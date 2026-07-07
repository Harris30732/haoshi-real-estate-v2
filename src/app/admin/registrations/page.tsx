'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { useStores } from '@/hooks/use-stores'
import {
  useRegistrationRequests,
  useApproveRegistration,
  useRejectRegistration,
} from '@/hooks/use-registration-requests'
import { ROLE_LABELS } from '@/lib/constants'
import type { RegistrationRequest, Role } from '@/types/user'

export default function RegistrationsPage() {
  const profile = useAuth((s) => s.profile)
  const isOwner = profile?.role_key === 'owner'
  const requests = useRegistrationRequests()
  const stores = useStores()
  const approve = useApproveRegistration()
  const reject = useRejectRegistration()

  const [approveTarget, setApproveTarget] = useState<RegistrationRequest | null>(null)
  const [approveRole, setApproveRole] = useState<Role>('employee')
  // 核准 modal 內，admin 可微調最終 store：套用提案 / 改派既有 / 創新店
  const [approveMode, setApproveMode] = useState<'as_proposed' | 'override_existing' | 'create_new'>('as_proposed')
  const [overrideStoreId, setOverrideStoreId] = useState('')
  const [createName, setCreateName] = useState('')
  const [createCode, setCreateCode] = useState('')
  const [createRegion, setCreateRegion] = useState('')
  const [rejectTarget, setRejectTarget] = useState<RegistrationRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const storeName = (id: string | null) =>
    id ? (stores.data?.find((s) => s.id === id)?.name ?? id) : '（未指定）'
  const rows = requests.data ?? []

  // 開啟核准 dialog 時，依申請類型預設 mode
  const openApprove = (r: RegistrationRequest) => {
    setApproveTarget(r)
    setApproveRole('employee')
    if (r.store_id) {
      setApproveMode('as_proposed')
      setOverrideStoreId(r.store_id)
      setCreateName('')
      setCreateCode('')
      setCreateRegion('')
    } else {
      // 新店申請 → 預填 admin 編輯欄位
      setApproveMode('create_new')
      setOverrideStoreId('')
      setCreateName(r.proposed_store_name || '')
      setCreateCode(r.proposed_store_code || '')
      setCreateRegion(r.proposed_store_region || '')
    }
  }

  const handleApprove = async () => {
    if (!approveTarget) return
    try {
      await approve.mutateAsync({
        requestId: approveTarget.id,
        role: approveRole,
        storeId: approveMode === 'override_existing' ? overrideStoreId : null,
        createStoreName: approveMode === 'create_new' ? createName : null,
        createStoreCode: approveMode === 'create_new' ? createCode : null,
        createStoreRegion: approveMode === 'create_new' ? createRegion : null,
      })
      setApproveTarget(null)
      setApproveRole('employee')
    } catch {
      /* onError 已 toast */
    }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    try {
      await reject.mutateAsync({ requestId: rejectTarget.id, reason: rejectReason.trim() })
      setRejectTarget(null)
      setRejectReason('')
    } catch {
      /* onError 已 toast */
    }
  }

  return (
    <AppShell title="待審核申請">
      <Card>
        <CardContent className="p-0">
          {requests.isLoading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">載入中…</p>
          ) : requests.isError ? (
            <p className="p-6 text-center text-sm text-destructive">載入失敗，請重新整理頁面</p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              目前沒有待審核的申請
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>分機</TableHead>
                  <TableHead>申請店別</TableHead>
                  <TableHead>申請時間</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.full_name}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.phone_ext || '—'}</TableCell>
                    <TableCell>
                      {r.store_id ? (
                        storeName(r.store_id)
                      ) : (
                        <div className="text-xs space-y-0.5">
                          <div className="text-amber-600 font-medium">🆕 新店申請</div>
                          <div className="text-foreground">{r.proposed_store_name}</div>
                          {(r.proposed_store_code || r.proposed_store_region) && (
                            <div className="text-muted-foreground">
                              {[r.proposed_store_code, r.proposed_store_region].filter(Boolean).join(' / ')}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(r.created_at).toLocaleDateString('zh-TW')}
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button size="sm" onClick={() => openApprove(r)}>
                        核准
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRejectTarget(r)
                          setRejectReason('')
                        }}
                      >
                        駁回
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 核准 */}
      <Dialog open={!!approveTarget} onOpenChange={(o) => !o && setApproveTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>核准申請</DialogTitle>
            <DialogDescription>
              核准「{approveTarget?.full_name}」加入並指派角色。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* 申請人提案的店資訊 — admin 參考 */}
            {approveTarget && (
              <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
                <div className="text-xs text-muted-foreground">申請人提案</div>
                {approveTarget.store_id ? (
                  <div>套用既有店：<span className="font-medium">{storeName(approveTarget.store_id)}</span></div>
                ) : (
                  <div className="space-y-0.5">
                    <div>🆕 新店申請：<span className="font-medium">{approveTarget.proposed_store_name}</span></div>
                    {(approveTarget.proposed_store_code || approveTarget.proposed_store_region) && (
                      <div className="text-xs text-muted-foreground">
                        {[approveTarget.proposed_store_code, approveTarget.proposed_store_region].filter(Boolean).join(' / ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mode 切換 */}
            <div className="space-y-1.5">
              <Label>店別處置</Label>
              <Select value={approveMode} onValueChange={(v) => setApproveMode(v as typeof approveMode)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {approveTarget?.store_id && (
                    <SelectItem value="as_proposed">套用申請人選的店（{storeName(approveTarget.store_id)}）</SelectItem>
                  )}
                  <SelectItem value="override_existing">改派到其他既有店</SelectItem>
                  {isOwner && <SelectItem value="create_new">建立新店並指派</SelectItem>}
                </SelectContent>
              </Select>
              {!isOwner && (
                <p className="text-xs text-muted-foreground">建立新店僅 Owner 可操作。</p>
              )}
            </div>

            {approveMode === 'override_existing' && (
              <div className="space-y-1.5">
                <Label>選擇店別</Label>
                <Select value={overrideStoreId} onValueChange={(v) => setOverrideStoreId(v ?? '')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="選擇要指派的店" />
                  </SelectTrigger>
                  <SelectContent>
                    {(stores.data ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}（{s.code}）</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {approveMode === 'create_new' && (
              <div className="space-y-2 p-3 rounded-md border border-dashed">
                <p className="text-xs text-muted-foreground">建立新店並把申請人指派為該店成員。</p>
                <div className="space-y-1.5">
                  <Label>店名 *</Label>
                  <input
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="例：青埔國小新生加盟店"
                    maxLength={80}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label>店號（選填）</Label>
                    <input
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      value={createCode}
                      onChange={(e) => setCreateCode(e.target.value)}
                      placeholder="例：BA119"
                      maxLength={20}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>地區（選填）</Label>
                    <input
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      value={createRegion}
                      onChange={(e) => setCreateRegion(e.target.value)}
                      placeholder="例：桃園"
                      maxLength={20}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="role">指派角色</Label>
              <Select value={approveRole} onValueChange={(v) => setApproveRole(v as Role)}>
                <SelectTrigger id="role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">{ROLE_LABELS.employee}</SelectItem>
                  {isOwner && <SelectItem value="manager">{ROLE_LABELS.manager}</SelectItem>}
                </SelectContent>
              </Select>
              {!isOwner && (
                <p className="text-xs text-muted-foreground">店長僅能指派員工角色。</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveTarget(null)}>
              取消
            </Button>
            <Button
              onClick={handleApprove}
              disabled={
                approve.isPending
                || (approveMode === 'override_existing' && !overrideStoreId)
                || (approveMode === 'create_new' && !createName.trim())
              }
            >
              {approve.isPending ? '處理中…' : '確認核准'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 駁回 */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>駁回申請</DialogTitle>
            <DialogDescription>
              駁回「{rejectTarget?.full_name}」的加入申請。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reason">駁回原因（選填）</Label>
            <Textarea
              id="reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={200}
              placeholder="例：非本店人員"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={reject.isPending}>
              {reject.isPending ? '處理中…' : '確認駁回'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
