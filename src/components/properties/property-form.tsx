'use client'

import { useState, useEffect } from 'react'
import { Property, PropertyFormData } from '@/types/property'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'
import { PROPERTY_STATUS, CONTRACT_TYPES, LAYOUT_TYPES } from '@/lib/constants'

interface PropertyFormProps {
  open: boolean
  onClose: () => void
  property?: Property | null
  onSave: (data: PropertyFormData) => void
  isSaving?: boolean
  communities?: string[]
}

const emptyForm: PropertyFormData = {
  community_name: '',
  total_price: null,
  total_ping: null,
  parking_ping: null,
  parking_price: null,
  floor_info: '',
  address: '',
  status: PROPERTY_STATUS.FOR_SALE,
  contract_type: '',
  consignor: '',
  layout: '',
  notes: '',
}

export function PropertyForm({ open, onClose, property, onSave, isSaving, communities = [] }: PropertyFormProps) {
  const [form, setForm] = useState<PropertyFormData>(emptyForm)
  const isEdit = !!property

  useEffect(() => {
    if (property) {
      setForm({
        community_name: property.community_name || '',
        total_price: property.total_price,
        total_ping: property.total_ping,
        parking_ping: property.parking_ping,
        parking_price: property.parking_price,
        floor_info: property.floor_info || '',
        address: property.address || '',
        status: property.status || PROPERTY_STATUS.FOR_SALE,
        contract_type: property.contract_type || '',
        consignor: property.consignor || '',
        layout: property.layout || '',
        notes: property.notes || '',
      })
    } else {
      setForm(emptyForm)
    }
  }, [property, open])

  const setField = (key: keyof PropertyFormData, value: string | number | null) => {
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
          <SheetTitle>{isEdit ? '編輯物件' : '新增物件'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* 基本資訊 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">基本資訊</h4>

            <div>
              <Label htmlFor="community">社區名稱 *</Label>
              <Input
                id="community"
                value={form.community_name}
                onChange={(e) => setField('community_name', e.target.value)}
                list="community-list"
                required
              />
              <datalist id="community-list">
                {communities.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="totalPrice">總價（萬）</Label>
                <Input
                  id="totalPrice"
                  type="number"
                  step="0.01"
                  value={form.total_price ?? ''}
                  onChange={(e) => setField('total_price', e.target.value ? parseFloat(e.target.value) : null)}
                />
              </div>
              <div>
                <Label htmlFor="totalPing">總坪數</Label>
                <Input
                  id="totalPing"
                  type="number"
                  step="0.01"
                  value={form.total_ping ?? ''}
                  onChange={(e) => setField('total_ping', e.target.value ? parseFloat(e.target.value) : null)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="parkingPing">車位坪數</Label>
                <Input
                  id="parkingPing"
                  type="number"
                  step="0.01"
                  value={form.parking_ping ?? ''}
                  onChange={(e) => setField('parking_ping', e.target.value ? parseFloat(e.target.value) : null)}
                />
              </div>
              <div>
                <Label htmlFor="parkingPrice">車價（萬）</Label>
                <Input
                  id="parkingPrice"
                  type="number"
                  step="0.01"
                  value={form.parking_price ?? ''}
                  onChange={(e) => setField('parking_price', e.target.value ? parseFloat(e.target.value) : null)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="floor">樓層</Label>
                <Input
                  id="floor"
                  placeholder="如：12樓/共25樓"
                  value={form.floor_info}
                  onChange={(e) => setField('floor_info', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="layout">格局</Label>
                <Select value={form.layout} onValueChange={(v) => setField('layout', v)}>
                  <SelectTrigger id="layout">
                    <SelectValue placeholder="選擇格局" />
                  </SelectTrigger>
                  <SelectContent>
                    {LAYOUT_TYPES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="address">地址</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setField('address', e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* 委託資訊 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">委託資訊</h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="status">狀態</Label>
                <Select value={form.status} onValueChange={(v) => setField('status', v)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(PROPERTY_STATUS).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="contractType">委託形式</Label>
                <Select value={form.contract_type} onValueChange={(v) => setField('contract_type', v)}>
                  <SelectTrigger id="contractType">
                    <SelectValue placeholder="選擇" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(CONTRACT_TYPES).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="consignor">委託人</Label>
              <Input
                id="consignor"
                value={form.consignor}
                onChange={(e) => setField('consignor', e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* 備註 */}
          <div>
            <Label htmlFor="notes">備註</Label>
            <Textarea
              id="notes"
              rows={3}
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {isEdit ? '更新' : '新增'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
