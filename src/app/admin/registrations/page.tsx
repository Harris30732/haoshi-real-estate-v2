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
  const [rejectTarget, setRejectTarget] = useState<RegistrationRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const storeName = (id: string) => stores.data?.find((s) => s.id === id)?.name ?? id
  const rows = requests.data ?? []

  const handleApprove = async () => {
    if (!approveTarget) return
    try {
      await approve.mutateAsync({ requestId: approveTarget.id, role: approveRole })
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
                    <TableCell>{storeName(r.store_id)}</TableCell>
                    <TableCell>
                      {new Date(r.created_at).toLocaleDateString('zh-TW')}
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button
                        size="sm"
                        onClick={() => {
                          setApproveTarget(r)
                          setApproveRole('employee')
                        }}
                      >
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>核准申請</DialogTitle>
            <DialogDescription>
              核准「{approveTarget?.full_name}」加入並指派角色。
            </DialogDescription>
          </DialogHeader>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveTarget(null)}>
              取消
            </Button>
            <Button onClick={handleApprove} disabled={approve.isPending}>
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
