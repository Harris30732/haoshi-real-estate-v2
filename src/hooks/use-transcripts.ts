'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Transcript } from '@/types/transcript'

// JOIN communities → 攤平到 transcripts 頂層
// P2 schema: transcripts 只存 community_id，社區屬性在 communities 表
type CommunityJoined = {
  name?: string | null
  address?: string | null
  builder?: string | null
  completion_date?: string | null
  building_floors?: string | null
  total_units?: number | null
  units_per_floor?: string | null
  ping_range?: string | null
  layout_plan?: string | null
  building_type?: string | null
  management_type?: string | null
  main_structure?: string | null
}

type RawTranscriptRow = Omit<Transcript, `community_${string}`> & {
  community?: CommunityJoined | null
}

function flattenCommunity(rows: RawTranscriptRow[]): Transcript[] {
  return rows.map((r) => ({
    ...(r as object),
    community_name: r.community?.name || '',
    community_address: r.community?.address || null,
    community_builder: r.community?.builder || null,
    community_completion_date: r.community?.completion_date || null,
    community_building_floors: r.community?.building_floors || null,
    community_total_units: r.community?.total_units ?? null,
    community_units_per_floor: r.community?.units_per_floor || null,
    community_ping_range: r.community?.ping_range || null,
    community_layout_plan: r.community?.layout_plan || null,
    community_building_type: r.community?.building_type || null,
    community_management_type: r.community?.management_type || null,
    community_main_structure: r.community?.main_structure || null,
  }) as Transcript)
}

// PostgREST 單次回應上限 1000 列 → 必須用 range 分頁把全量撈完，
// 否則大社區（潤隆 824 戶）或全社區檢視會被靜默截斷。
const PAGE_SIZE = 1000

export function useTranscripts(communityName?: string) {
  return useQuery({
    queryKey: ['transcripts', communityName],
    queryFn: async () => {
      let communityId: string | null = null
      if (communityName) {
        // 先查 community_id by name（avoid filter on joined column）
        const { data: c, error: cErr } = await supabase
          .from('communities')
          .select('id')
          .eq('name', communityName)
          .single()
        if (cErr || !c) return []
        communityId = c.id
      }

      const all: RawTranscriptRow[] = []
      for (let from = 0; ; from += PAGE_SIZE) {
        let query = supabase
          .from('transcripts')
          .select('*, community:communities(name, address, builder, completion_date, building_floors, total_units, units_per_floor, ping_range, layout_plan, building_type, management_type, main_structure)')
          .order('community_id', { ascending: true })
          .order('ycut_object_key', { ascending: true })
          .range(from, from + PAGE_SIZE - 1)
        if (communityId) query = query.eq('community_id', communityId)
        const { data, error } = await query
        if (error) throw error
        const rows = (data || []) as unknown as RawTranscriptRow[]
        all.push(...rows)
        if (rows.length < PAGE_SIZE) break
      }
      return flattenCommunity(all)
    },
    staleTime: 120_000,
  })
}

export function useTranscriptStats() {
  return useQuery({
    queryKey: ['transcript-stats'],
    queryFn: async () => {
      // server 端聚合（SECURITY INVOKER，照 RLS 各看各的）；
      // 原本前端撈全表 community_id 數行會被 PostgREST 1000 列上限截斷。
      const { data, error } = await supabase.rpc('transcript_stats')
      if (error) throw error
      const rows = (data ?? []) as { community_name: string; transcript_count: number }[]
      const communities = rows.map((r) => ({
        name: r.community_name,
        count: Number(r.transcript_count),
      }))
      return {
        total: communities.reduce((s, c) => s + c.count, 0),
        communities,
      }
    },
    staleTime: 300_000,
  })
}
