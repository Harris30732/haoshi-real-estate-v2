'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useStores } from '@/hooks/use-stores'
import { CostRateForm } from '@/components/admin/pricing/cost-rate-form'
import { SellRateForm } from '@/components/admin/pricing/sell-rate-form'
import { BillingMonthPanel } from '@/components/admin/pricing/billing-month-panel'
import { BillingOverviewTable } from '@/components/admin/pricing/billing-overview-table'

const selectCls =
  'h-8 rounded-lg border border-input bg-transparent px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'

export default function PricingPage() {
  const stores = useStores()
  const [sellStoreId, setSellStoreId] = useState<string>('')

  return (
    <AppShell title="計價帳務" requiredRole="owner">
      <Tabs defaultValue="rates">
        <TabsList>
          <TabsTrigger value="rates">費率設定</TabsTrigger>
          <TabsTrigger value="billing">月結帳務</TabsTrigger>
          <TabsTrigger value="overview">跨店總覽</TabsTrigger>
        </TabsList>

        <TabsContent value="rates" className="space-y-4 pt-4">
          <CostRateForm />

          <SellRateForm
            storeId={null}
            title="全域預設售價"
            description="所有店家的預設售價；個別店未設定時套用此值。"
          />

          <div className="space-y-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">選擇店家設定專屬售價</span>
              <select
                className={selectCls + ' w-64'}
                value={sellStoreId}
                onChange={(e) => setSellStoreId(e.target.value)}
              >
                <option value="">選擇店家…</option>
                {(stores.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}（{s.code}）
                  </option>
                ))}
              </select>
            </label>
            {sellStoreId && (
              <SellRateForm
                key={sellStoreId}
                storeId={sellStoreId}
                title={`專屬售價：${stores.data?.find((s) => s.id === sellStoreId)?.name ?? ''}`}
                description="此店專屬售價，覆蓋全域預設。未設定的項目自動套用全域預設。"
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="billing" className="pt-4">
          <BillingMonthPanel />
        </TabsContent>

        <TabsContent value="overview" className="pt-4">
          <BillingOverviewTable />
        </TabsContent>
      </Tabs>
    </AppShell>
  )
}
