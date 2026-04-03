'use client'

import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { useProperties } from '@/hooks/use-properties'
import { useCreateCommunity, useUpdateCommunity, useDeleteCommunity } from '@/hooks/use-communities'
import { CommunityForm } from '@/components/communities/community-form'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Community } from '@/types/community'

export default function CommunitiesPage() {
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Community | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useProperties()
  const createMut = useCreateCommunity()
  const updateMut = useUpdateCommunity()
  const deleteMut = useDeleteCommunity()

  const communities = data?.communities || []
  const filtered = useMemo(() => {
    if (!search) return communities
    const q = search.toLowerCase()
    return communities.filter((c) =>
      c.community_name?.toLowerCase().includes(q) || c.builder?.toLowerCase().includes(q)
    )
  }, [communities, search])

  const handleSave = useCallback((formData: Partial<Community>) => {
    if (editing) {
      updateMut.mutate({ id: editing.id, data: formData }, { onSuccess: () => setFormOpen(false) })
    } else {
      createMut.mutate(formData, { onSuccess: () => setFormOpen(false) })
    }
  }, [editing, createMut, updateMut])

  return (
    <AppShell title="社區管理">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋社區或建商..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
          <Plus className="h-4 w-4 mr-1" />
          新增社區
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-sm">{c.community_name}</h3>
                    {c.builder && <p className="text-xs text-muted-foreground">{c.builder}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(c); setFormOpen(true) }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(c.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {c.completion_date && <Badge variant="secondary" className="text-xs">民國{c.completion_date}年</Badge>}
                  {c.total_units && <Badge variant="secondary" className="text-xs">{c.total_units}戶</Badge>}
                  {c.unit_area_range && <Badge variant="outline" className="text-xs">{c.unit_area_range}坪</Badge>}
                </div>
                {(c.elementary_school || c.junior_high_school) && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {c.elementary_school && `國小: ${c.elementary_school}`}
                    {c.elementary_school && c.junior_high_school && ' · '}
                    {c.junior_high_school && `國中: ${c.junior_high_school}`}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center py-20 text-muted-foreground">
              {search ? '找不到符合的社區' : '暫無社區資料'}
            </p>
          )}
        </div>
      )}

      <CommunityForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        community={editing}
        onSave={handleSave}
        isSaving={createMut.isPending || updateMut.isPending}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteMut.mutate(deleteId, { onSuccess: () => setDeleteId(null) }) }}
        title="刪除社區"
        description="確定要刪除這個社區嗎？"
        confirmLabel="刪除"
        isLoading={deleteMut.isPending}
        destructive
      />
    </AppShell>
  )
}
