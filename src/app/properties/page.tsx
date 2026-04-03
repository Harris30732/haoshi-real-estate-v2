'use client'

import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, LayoutGrid, List, Loader2, BarChart3 } from 'lucide-react'
import { useState, useCallback } from 'react'
import { useProperties, useCreateProperty, useUpdateProperty, useDeleteProperty } from '@/hooks/use-properties'
import { useFilteredProperties } from '@/hooks/use-filtered-properties'
import { PropertyTable } from '@/components/properties/property-table'
import { PropertyCard } from '@/components/properties/property-card'
import { PropertyFilters } from '@/components/properties/property-filters'
import { PropertyForm } from '@/components/properties/property-form'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PriceDistributionChart } from '@/components/charts/price-distribution'
import { AreaDistributionChart } from '@/components/charts/area-distribution'
import { CommunityComparisonChart } from '@/components/charts/community-chart'
import { PriceVsAreaChart } from '@/components/charts/price-vs-area'
import { Property, PropertyFormData } from '@/types/property'
import { PROPERTY_STATUS } from '@/lib/constants'

export default function PropertiesPage() {
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [tab, setTab] = useState<'active' | 'archived'>('active')
  const [showCharts, setShowCharts] = useState(false)

  // CRUD state
  const [formOpen, setFormOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading, error } = useProperties()
  const createMutation = useCreateProperty()
  const updateMutation = useUpdateProperty()
  const deleteMutation = useDeleteProperty()

  const properties = data?.properties || []
  const communities = data?.communities?.map((c) => c.community_name) || []

  const tabFiltered = properties.filter((p) =>
    tab === 'active'
      ? p.status !== PROPERTY_STATUS.DELISTED && p.status !== PROPERTY_STATUS.SOLD
      : p.status === PROPERTY_STATUS.DELISTED || p.status === PROPERTY_STATUS.SOLD
  )

  const { filtered, dataLimits } = useFilteredProperties(tabFiltered)

  // Handlers
  const handleAdd = useCallback(() => {
    setEditingProperty(null)
    setFormOpen(true)
  }, [])

  const handleEdit = useCallback((property: Property) => {
    setEditingProperty(property)
    setFormOpen(true)
  }, [])

  const handleDelete = useCallback((id: string) => {
    setDeleteId(id)
  }, [])

  const handleSave = useCallback((formData: PropertyFormData) => {
    if (editingProperty) {
      updateMutation.mutate(
        { id: editingProperty.id, data: formData },
        { onSuccess: () => setFormOpen(false) }
      )
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => setFormOpen(false),
      })
    }
  }, [editingProperty, createMutation, updateMutation])

  const handleConfirmDelete = useCallback(() => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      })
    }
  }, [deleteId, deleteMutation])

  return (
    <AppShell title="物件管理">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'active' | 'archived')}>
          <TabsList>
            <TabsTrigger value="active">
              在售物件
              <span className="ml-1.5 text-xs opacity-70">{filtered.length}</span>
            </TabsTrigger>
            <TabsTrigger value="archived">已下架/成交</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button
            variant={showCharts ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowCharts(!showCharts)}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            圖表
          </Button>
          <div className="flex border rounded-md">
            <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm" className="rounded-r-none" onClick={() => setViewMode('table')}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'card' ? 'default' : 'ghost'} size="sm" className="rounded-l-none" onClick={() => setViewMode('card')}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" />
            新增物件
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <PropertyFilters allProperties={tabFiltered} dataLimits={dataLimits} />
      </div>

      {/* Charts — linked to filtered data */}
      {showCharts && (
        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <PriceDistributionChart properties={filtered} />
          <AreaDistributionChart properties={filtered} />
          <CommunityComparisonChart properties={filtered} />
          <PriceVsAreaChart properties={filtered} />
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">載入中...</span>
        </div>
      ) : error ? (
        <div className="py-10 text-center text-destructive">
          載入失敗：{(error as Error).message}
        </div>
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

      {/* Property Form (Side Drawer) */}
      <PropertyForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        property={editingProperty}
        onSave={handleSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
        communities={communities}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="刪除物件"
        description="確定要刪除這個物件嗎？此操作無法復原。"
        confirmLabel="刪除"
        isLoading={deleteMutation.isPending}
        destructive
      />
    </AppShell>
  )
}
