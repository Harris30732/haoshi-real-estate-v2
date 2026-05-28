'use client'

import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Search, Loader2, ExternalLink, ChevronLeft, ChevronRight, Download, Building2, MapPin, Home, Plus,
} from 'lucide-react'
import { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useTranscripts, useTranscriptStats } from '@/hooks/use-transcripts'
import { useMyPermissions } from '@/hooks/use-permissions'
import { exportTranscriptsXlsx } from '@/lib/import-export'
import { formatDoor } from '@/lib/transcript-format'
import { PERMISSIONS } from '@/lib/constants'
import { ImportDialog } from '@/components/transcripts/import-dialog'
import { ScrapeStatusBar } from '@/components/transcripts/scrape-status-bar'

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5 min-w-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium truncate" title={value}>{value}</span>
    </div>
  )
}

/**
 * useSearchParams 必須在 Suspense 內（Next.js 14+ static rendering 要求）。
 * 把 query param 處理抽到子元件，父元件 wrap Suspense。
 */
function ActionParamHandler({ onImport }: { onImport: () => void }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  useEffect(() => {
    if (searchParams.get('action') === 'import') {
      onImport()
      router.replace('/transcripts')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
  return null
}

export default function TranscriptsPage() {
  const [search, setSearch] = useState('')
  const [selectedCommunity, setSelectedCommunity] = useState<string | undefined>()
  const [page, setPage] = useState(0)
  const [importOpen, setImportOpen] = useState(false)

  const permissions = useMyPermissions()
  const canSubmitScrape = permissions.has(PERMISSIONS.SCRAPE_SUBMIT)

  const { data: stats, isLoading: statsLoading } = useTranscriptStats()
  const { data: transcripts, isLoading: dataLoading } = useTranscripts(selectedCommunity)

  const filteredCommunities = useMemo(() => {
    if (!stats?.communities) return []
    if (!search) return stats.communities
    const q = search.toLowerCase()
    return stats.communities.filter((c) => c.name.toLowerCase().includes(q))
  }, [stats, search])

  const pageSize = 50
  const pagedTranscripts = useMemo(() => {
    if (!transcripts) return []
    return transcripts.slice(page * pageSize, (page + 1) * pageSize)
  }, [transcripts, page])
  const totalPages = Math.ceil((transcripts?.length || 0) / pageSize)

  // 社區資訊卡用：取第一筆 transcript 的 community 資訊（同社區內所有 transcript community_name/community_address 都一樣）
  const communityInfo = useMemo(() => {
    if (!selectedCommunity || !transcripts || transcripts.length === 0) return null
    const first = transcripts[0]
    // 從目前資料 derive 統計
    const unitCount = transcripts.length
    const withPdf = transcripts.filter((t) => t.pdf_url).length
    const withMortgage = transcripts.filter((t) => t.mortgage_total != null).length
    const avgPing = (() => {
      const vals = transcripts
        .map((t) => Number(t.total_ping ?? t.main_area_ping))
        .filter((v) => isFinite(v) && v > 0)
      if (vals.length === 0) return null
      return vals.reduce((a, b) => a + b, 0) / vals.length
    })()
    return {
      name: first.community_name || selectedCommunity,
      address: first.community_address,
      builder: first.community_builder,
      completion_date: first.community_completion_date,
      building_floors: first.community_building_floors,
      total_units: first.community_total_units,
      units_per_floor: first.community_units_per_floor,
      ping_range: first.community_ping_range,
      layout_plan: first.community_layout_plan,
      building_type: first.community_building_type,
      management_type: first.community_management_type,
      main_structure: first.community_main_structure,
      unitCount,
      withPdf,
      withMortgage,
      avgPing,
    }
  }, [selectedCommunity, transcripts])

  const [exporting, setExporting] = useState(false)
  const handleExport = async () => {
    if (!transcripts || transcripts.length === 0) {
      toast.error('沒有資料可以匯出')
      return
    }
    setExporting(true)
    try {
      await exportTranscriptsXlsx(transcripts)
      toast.success(`已匯出 ${transcripts.length} 筆客服名單`)
    } catch (err) {
      console.error(err)
      toast.error('匯出失敗：' + (err instanceof Error ? err.message : '未知錯誤'))
    } finally {
      setExporting(false)
    }
  }

  return (
    <AppShell title="謄本資料">
      <Suspense fallback={null}>
        <ActionParamHandler onImport={() => setImportOpen(true)} />
      </Suspense>

      {/* 狀態欄：active scrapes（0 自動隱藏）*/}
      <div className="mb-4">
        <ScrapeStatusBar />
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Community sidebar */}
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground px-1">
            {statsLoading ? '...' : `共 ${stats?.communities?.length || 0} 個社區・${stats?.total || 0} 筆`}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜尋社區..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="rounded-lg border max-h-[640px] overflow-y-auto">
            <button
              className={`w-full text-left px-3 py-2 text-sm border-b hover:bg-accent ${!selectedCommunity ? 'bg-primary/10 text-primary font-medium' : ''}`}
              onClick={() => { setSelectedCommunity(undefined); setPage(0) }}
            >
              <div className="flex justify-between items-center">
                <span>全部社區</span>
                <Badge variant="secondary" className="text-xs">{stats?.total || 0}</Badge>
              </div>
            </button>
            {filteredCommunities.map((c) => (
              <button
                key={c.name}
                className={`w-full text-left px-3 py-2 text-sm border-b hover:bg-accent ${selectedCommunity === c.name ? 'bg-primary/10 text-primary font-medium' : ''}`}
                onClick={() => { setSelectedCommunity(c.name); setPage(0) }}
              >
                <div className="flex justify-between items-center">
                  <span className="truncate mr-2">{c.name}</span>
                  <Badge variant="secondary" className="text-xs shrink-0">{c.count}</Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* 社區資訊 header card */}
          {communityInfo ? (
            <Card>
              <CardContent className="pt-6 space-y-3">
                {/* 第一行：名稱 + 地址 + 匯出 button */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-bold truncate">{communityInfo.name}</h2>
                      {communityInfo.building_type && (
                        <Badge variant="secondary" className="text-xs">{communityInfo.building_type}</Badge>
                      )}
                    </div>
                    {communityInfo.address && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span>{communityInfo.address}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {canSubmitScrape && (
                      <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        匯入社區
                      </Button>
                    )}
                    <Button variant="default" size="sm" onClick={handleExport} disabled={exporting}>
                      {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                      匯出客服名單
                    </Button>
                  </div>
                </div>

                {/* 第二行：YCUT 社區介紹資訊（grid） */}
                {(communityInfo.builder || communityInfo.completion_date || communityInfo.total_units || communityInfo.building_floors) && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1.5 text-sm pt-2 border-t">
                    {communityInfo.builder && (
                      <InfoField label="建設公司" value={communityInfo.builder} />
                    )}
                    {communityInfo.completion_date && (
                      <InfoField label="完工日期" value={communityInfo.completion_date} />
                    )}
                    {communityInfo.building_floors && (
                      <InfoField label="建物樓層" value={communityInfo.building_floors} />
                    )}
                    {communityInfo.total_units != null && (
                      <InfoField label="總戶數" value={`${communityInfo.total_units}戶`} />
                    )}
                    {communityInfo.units_per_floor && (
                      <InfoField label="同層戶數" value={communityInfo.units_per_floor} />
                    )}
                    {communityInfo.ping_range && (
                      <InfoField label="坪數規劃" value={communityInfo.ping_range} />
                    )}
                    {communityInfo.layout_plan && (
                      <InfoField label="格局規劃" value={communityInfo.layout_plan} />
                    )}
                    {communityInfo.main_structure && (
                      <InfoField label="主結構" value={communityInfo.main_structure} />
                    )}
                    {communityInfo.management_type && (
                      <InfoField label="管理方式" value={communityInfo.management_type} />
                    )}
                  </div>
                )}

                {/* 第三行：抓取統計 */}
                <div className="flex gap-4 text-sm pt-2 border-t flex-wrap">
                  <span className="flex items-center gap-1">
                    <Home className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{communityInfo.unitCount}</span>
                    <span className="text-muted-foreground">
                      已抓戶{communityInfo.total_units ? ` / ${communityInfo.total_units}戶` : ''}
                    </span>
                  </span>
                  {communityInfo.avgPing !== null && (
                    <span>
                      <span className="font-medium">{communityInfo.avgPing.toFixed(1)}</span>
                      <span className="text-muted-foreground"> 平均坪數</span>
                    </span>
                  )}
                  <span>
                    <span className="font-medium">{communityInfo.withPdf}</span>
                    <span className="text-muted-foreground"> 含 PDF</span>
                  </span>
                  <span>
                    <span className="font-medium">{communityInfo.withMortgage}</span>
                    <span className="text-muted-foreground"> 有抵押權</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium">全部社區謄本</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    左側點選社區可看詳細資訊；目前顯示所有社區彙整
                  </div>
                </div>
                <div className="flex gap-2">
                  {canSubmitScrape && (
                    <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      匯入社區
                    </Button>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleExport}
                    disabled={exporting || !transcripts || transcripts.length === 0}
                  >
                    {exporting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    匯出客服名單
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 戶級表（客服視角）*/}
          {dataLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {!selectedCommunity && (
                        <TableHead className="text-xs whitespace-nowrap">社區</TableHead>
                      )}
                      <TableHead className="text-xs whitespace-nowrap">建物地址</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">所有權人</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">所有權人地址</TableHead>
                      <TableHead className="text-xs whitespace-nowrap text-right">坪數</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">登記日期</TableHead>
                      <TableHead className="text-xs whitespace-nowrap text-right">抵押權</TableHead>
                      <TableHead className="text-xs whitespace-nowrap text-center">PDF</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedTranscripts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={selectedCommunity ? 7 : 8} className="h-24 text-center text-muted-foreground">
                          {selectedCommunity ? `「${selectedCommunity}」暫無謄本資料` : '尚無謄本資料'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedTranscripts.map((t) => (
                        <TableRow key={t.id} className="text-sm">
                          {!selectedCommunity && (
                            <TableCell className="whitespace-nowrap font-medium">{t.community_name || '—'}</TableCell>
                          )}
                          <TableCell className="whitespace-nowrap font-medium">{formatDoor(t.ycut_object_key)}</TableCell>
                          <TableCell className="whitespace-nowrap">{t.owner_name || '—'}</TableCell>
                          <TableCell className="max-w-[360px] truncate" title={t.owner_address || ''}>
                            {t.owner_address || '—'}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right">
                            {t.total_ping ?? t.main_area_ping ?? '—'}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            {t.registration_date || '—'}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right">
                            {t.mortgage_total
                              ? Number(t.mortgage_total).toLocaleString()
                              : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-center">
                            {t.pdf_url ? (
                              <a href={t.pdf_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between py-1 text-sm text-muted-foreground">
                  <span>共 {transcripts?.length} 筆，第 {page + 1}/{totalPages} 頁</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </AppShell>
  )
}
