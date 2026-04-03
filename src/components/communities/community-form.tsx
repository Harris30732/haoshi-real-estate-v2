'use client'

import { useState, useEffect } from 'react'
import { Community } from '@/types/community'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'

interface CommunityFormProps {
  open: boolean
  onClose: () => void
  community?: Community | null
  onSave: (data: Partial<Community>) => void
  isSaving?: boolean
}

export function CommunityForm({ open, onClose, community, onSave, isSaving }: CommunityFormProps) {
  const [form, setForm] = useState<Partial<Community>>({})
  const isEdit = !!community

  useEffect(() => {
    if (community) {
      setForm({ ...community })
    } else {
      setForm({
        builder: '',
        community_name: '',
        completion_date: '',
        total_units: '',
        unit_area_range: '',
        address: '',
        elementary_school: '',
        junior_high_school: '',
      })
    }
  }, [community, open])

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? '編輯社區' : '新增社區'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-3">
            <div>
              <Label>社區名稱 *</Label>
              <Input value={form.community_name || ''} onChange={(e) => setField('community_name', e.target.value)} required />
            </div>
            <div>
              <Label>建商</Label>
              <Input value={form.builder || ''} onChange={(e) => setField('builder', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>完工年份（民國）</Label>
                <Input type="number" value={form.completion_date || ''} onChange={(e) => setField('completion_date', e.target.value)} placeholder="如：112" />
              </div>
              <div>
                <Label>總戶數</Label>
                <Input value={form.total_units || ''} onChange={(e) => setField('total_units', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>坪數範圍</Label>
              <Input value={form.unit_area_range || ''} onChange={(e) => setField('unit_area_range', e.target.value)} placeholder="如：25/45" />
            </div>
            <div>
              <Label>地址</Label>
              <Input value={form.address || ''} onChange={(e) => setField('address', e.target.value)} />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">學區資訊</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>國小學區</Label>
                <Input value={form.elementary_school || ''} onChange={(e) => setField('elementary_school', e.target.value)} />
              </div>
              <div>
                <Label>國中學區</Label>
                <Input value={form.junior_high_school || ''} onChange={(e) => setField('junior_high_school', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {isEdit ? '更新' : '新增'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
