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
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { useStoreMembers } from '@/hooks/use-store-members'
import { useStores } from '@/hooks/use-stores'
import { useUpdateProfileStatus, useUpdateProfileRole } from '@/hooks/use-profile'
import { useListInvites, useRevokeInvite } from '@/hooks/use-invites'
import { MemberPermissionDialog } from '@/components/admin/member-permission-dialog'
import { InviteMemberDialog } from '@/components/admin/invite-member-dialog'
import { ROLE_LABELS, PROFILE_STATUS_LABELS } from '@/lib/constants'
import { UserPlus } from 'lucide-react'
import type { Profile, Role } from '@/types/user'

export default function MembersPage() {
  const profile = useAuth((s) => s.profile)
  const isOwner = profile?.role_key === 'owner'
  const members = useStoreMembers()
  const stores = useStores()
  const invites = useListInvites()
  const revokeInvite = useRevokeInvite()
  const updateStatus = useUpdateProfileStatus()
  const updateRole = useUpdateProfileRole()
  const [permTarget, setPermTarget] = useState<Profile | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  const storeName = (id: string | null) =>
    id ? (stores.data?.find((s) => s.id === id)?.name ?? id) : '—'

  const toggleStatus = (m: Profile) =>
    updateStatus.mutate({
      profileId: m.id,
      status: m.status === 'active' ? 'suspended' : 'active',
    })

  const rows = members.data ?? []
  const pendingInvites = invites.data ?? []

  return (
    <AppShell title="成員管理">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          以 Email 邀請新成員，對方用該 Google 帳號登入即自動加入。
        </p>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          邀請成員
        </Button>
      </div>

      {pendingInvites.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-0">
            <div className="border-b px-4 py-2 text-sm font-medium text-muted-foreground">
              待接受邀請（{pendingInvites.length}）
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>店別</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvites.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell>{inv.full_name ?? '—'}</TableCell>
                    <TableCell>{ROLE_LABELS[inv.role_key]}</TableCell>
                    <TableCell>{inv.store_name}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => revokeInvite.mutate(inv.id)}
                        disabled={revokeInvite.isPending}
                      >
                        撤銷
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {members.isLoading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">載入中…</p>
          ) : members.isError ? (
            <p className="p-6 text-center text-sm text-destructive">載入失敗，請重新整理頁面</p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">尚無成員</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>店別</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((m) => {
                  const isSelf = m.id === profile?.id
                  return (
                    <TableRow key={m.id}>
                      <TableCell>{m.full_name}</TableCell>
                      <TableCell>{m.email}</TableCell>
                      <TableCell>
                        {isOwner && !isSelf ? (
                          <Select
                            value={m.role_key}
                            onValueChange={(v) =>
                              updateRole.mutate({ profileId: m.id, role: v as Role })
                            }
                          >
                            <SelectTrigger size="sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manager">{ROLE_LABELS.manager}</SelectItem>
                              <SelectItem value="employee">{ROLE_LABELS.employee}</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          ROLE_LABELS[m.role_key]
                        )}
                      </TableCell>
                      <TableCell>{storeName(m.store_id)}</TableCell>
                      <TableCell>
                        <Badge variant={m.status === 'active' ? 'secondary' : 'destructive'}>
                          {PROFILE_STATUS_LABELS[m.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPermTarget(m)}
                        >
                          權限
                        </Button>
                        {!isSelf && (
                          <Button
                            size="sm"
                            variant={m.status === 'active' ? 'destructive' : 'outline'}
                            onClick={() => toggleStatus(m)}
                            disabled={updateStatus.isPending}
                          >
                            {m.status === 'active' ? '停用' : '啟用'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <MemberPermissionDialog member={permTarget} onClose={() => setPermTarget(null)} />
      <InviteMemberDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </AppShell>
  )
}
