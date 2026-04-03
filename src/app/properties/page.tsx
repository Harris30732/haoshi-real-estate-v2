'use client'

import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, LayoutGrid, List, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useProperties } from '@/hooks/use-properties'
import { PropertyTable } from '@/components/properties/property-table'
import { PropertyCard } from '@/components/properties/property-card'
import { Property } from '@/types/property'
import { PROPERTY_STATUS } from '@/lib/constants'

export default function PropertiesPage() {
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [tab, setTab] = useState<'active' | 'archived'>('active')
  const { data, isLoading, error } = useProperties()

  const properties = data?.properties || []
  const filtered = properties.filter((p) =>
    tab === 'active'
      ? p.status !== PROPERTY_STATUS.DELISTED && p.status !== PROPERTY_STATUS.SOLD
      : p.status === PROPERTY_STATUS.DELISTED || p.status === PROPERTY_STATUS.SOLD
  )

  const handleEdit = (property: Property) => {
    // TODO: Open edit drawer/modal
    console.log('Edit:', property.id)
  }

  const handleDelete = (id: string) => {
    // TODO: Confirm dialog + delete
    console.log('Delete:', id)
  }

  return (
    <AppShell title="物件管理">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'active' | 'archived')}>
          <TabsList>
            <TabsTrigger value="active">
              在售物件
              {properties.filter(p => p.status !== PROPERTY_STATUS.DELISTED && p.status !== PROPERTY_STATUS.SOLD).length > 0 && (
                <span className="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  {properties.filter(p => p.status !== PROPERTY_STATUS.DELISTED && p.status !== PROPERTY_STATUS.SOLD).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="archived">已下架/成交</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode('card')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            新增物件
          </Button>
        </div>
      </div>

      {/* Filter placeholder */}
      <Card className="mb-4">
        <CardContent className="py-3">
          <p className="text-sm text-muted-foreground">
            篩選器（雙邊滑軌）— Phase 2 實作
          </p>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">載入中...</span>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center text-destructive">
            載入失敗：{(error as Error).message}
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <PropertyTable data={filtered} onEdit={handleEdit} onDelete={handleDelete} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.length === 0 ? (
            <p className="col-span-full text-center py-20 text-muted-foreground">暫無資料</p>
          ) : (
            filtered.map((p) => (
              <PropertyCard key={p.id} property={p} onEdit={handleEdit} onDelete={handleDelete} />
            ))
          )}
        </div>
      )}
    </AppShell>
  )
}
