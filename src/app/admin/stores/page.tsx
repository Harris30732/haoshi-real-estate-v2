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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useStores, useCreateStore } from '@/hooks/use-stores'
import { StoreGrantableDialog } from '@/components/admin/store-grantable-dialog'
import { PROFILE_STATUS_LABELS } from '@/lib/constants'
import type { Store } from '@/types/user'

export default function StoresPage() {
  const stores = useStores()
  const createStore = useCreateStore()

  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [region, setRegion] = useState('')
  const [grantTarget, setGrantTarget] = useState<Store | null>(null)

  const handleCreate = async () => {
    if (!name.trim() || !code.trim()) return
    try {
      await createStore.mutateAsync({
        name: name.trim(),
        code: code.trim(),
        region: region.trim() || null,
      })
      setCreateOpen(false)
      setName('')
      setCode('')
      setRegion('')
    } catch {
      /* onError 已 toast */
    }
  }

  const rows = stores.data ?? []

  return (
    <AppShell title="店別管理" requiredRole="owner">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>新增店別</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {stores.isLoading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">載入中…</p>
          ) : stores.isError ? (
            <p className="p-6 text-center text-sm text-destructive">載入失敗，請重新整理頁面</p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">尚無店別</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>店名</TableHead>
                  <TableHead>代號</TableHead>
                  <TableHead>區域</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.code}</TableCell>
                    <TableCell>{s.region || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === 'active' ? 'secondary' : 'destructive'}>
                        {PROFILE_STATUS_LABELS[s.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setGrantTarget(s)}>
                        店長可授予權限
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 建店 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增店別</DialogTitle>
            <DialogDescription>建立後可在成員管理指派店長。</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="storeName">店名</Label>
              <Input
                id="storeName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="storeCode">店代號</Label>
              <Input
                id="storeCode"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={20}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="storeRegion">區域（選填）</Label>
              <Input
                id="storeRegion"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                maxLength={50}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createStore.isPending || !name.trim() || !code.trim()}
            >
              {createStore.isPending ? '建立中…' : '建立'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StoreGrantableDialog store={grantTarget} onClose={() => setGrantTarget(null)} />
    </AppShell>
  )
}
