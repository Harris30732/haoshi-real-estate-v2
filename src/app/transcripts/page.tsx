'use client'

import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Search, Loader2, FileText, Building2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useTranscripts, useTranscriptStats } from '@/hooks/use-transcripts'

export default function TranscriptsPage() {
  const [search, setSearch] = useState('')
  const [selectedCommunity, setSelectedCommunity] = useState<string | undefined>()
  const [page, setPage] = useState(0)

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

  return (
    <AppShell title="謄本資料">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">總筆數</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.total?.toLocaleString() || '0'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">社區數</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.communities?.length || '0'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">目前檢視</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectedCommunity || '全部'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Community sidebar */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜尋社區..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="rounded-lg border max-h-[600px] overflow-y-auto">
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

        {/* Transcript table */}
        <div>
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
                      <TableHead className="text-xs whitespace-nowrap">社區</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">地址</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">所有人</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">登記原因</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">登記時間</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">坪數</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">主建物</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">公設</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">車位</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">擔保金額</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">PDF</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedTranscripts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                          {selectedCommunity ? `「${selectedCommunity}」暫無謄本資料` : '請先在 Supabase 建立 transcripts 表並遷移資料'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedTranscripts.map((t) => (
                        <TableRow key={t.id} className="text-sm">
                          <TableCell className="whitespace-nowrap font-medium">{t.community_name}</TableCell>
                          <TableCell className="whitespace-nowrap max-w-[150px] truncate" title={t.community_address || ''}>
                            {t.community_address || '—'}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{t.owner_name || '—'}</TableCell>
                          <TableCell className="whitespace-nowrap">{t.registration_reason || '—'}</TableCell>
                          <TableCell className="whitespace-nowrap text-xs">{t.registration_date || '—'}</TableCell>
                          <TableCell className="whitespace-nowrap">{t.area_ping || '—'}</TableCell>
                          <TableCell className="whitespace-nowrap">{t.main_area_ping || '—'}</TableCell>
                          <TableCell className="whitespace-nowrap">{t.public_area_ping || '—'}</TableCell>
                          <TableCell className="whitespace-nowrap">{t.parking_area_ping || '—'}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {t.mortgage_total ? Number(t.mortgage_total).toLocaleString() : '—'}
                          </TableCell>
                          <TableCell>
                            {t.pdf_url ? (
                              <a href={t.pdf_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between py-3 text-sm text-muted-foreground">
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
    </AppShell>
  )
}
