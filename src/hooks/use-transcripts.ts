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

export function useTranscripts(communityName?: string) {
  return useQuery({
    queryKey: ['transcripts', communityName],
    queryFn: async () => {
      let query = supabase
        .from('transcripts')
        .select('*, community:communities(name, address, builder, completion_date, building_floors, total_units, units_per_floor, ping_range, layout_plan, building_type, management_type, main_structure)')
        .order('community_id', { ascending: true })
        .order('ycut_object_key', { ascending: true })

      if (communityName) {
        // 先查 community_id by name（avoid filter on joined column）
        const { data: c, error: cErr } = await supabase
          .from('communities')
          .select('id')
          .eq('name', communityName)
          .single()
        if (cErr || !c) return []
        query = query.eq('community_id', c.id)
      }

      query = query.limit(500)
      const { data, error } = await query
      if (error) throw error
      return flattenCommunity((data || []) as unknown as RawTranscriptRow[])
    },
    staleTime: 120_000,
  })
}

export function useTranscriptStats() {
  return useQuery({
    queryKey: ['transcript-stats'],
    queryFn: async () => {
      // 1. 全部 transcripts 的 community_id
      const { data: trData, error: trErr } = await supabase
        .from('transcripts')
        .select('community_id')
      if (trErr) throw trErr

      const rows = trData || []
      const idMap: Record<string, number> = {}
      rows.forEach((r) => {
        const id = r.community_id as string
        if (id) idMap[id] = (idMap[id] || 0) + 1
      })

      // 2. 取對應 communities 的 name
      const ids = Object.keys(idMap)
      let communities: { name: string; count: number }[] = []
      if (ids.length > 0) {
        const { data: cs, error: cErr } = await supabase
          .from('communities')
          .select('id, name')
          .in('id', ids)
        if (cErr) throw cErr
        communities = (cs || []).map((c) => ({
          name: c.name as string,
          count: idMap[c.id as string] || 0,
        })).sort((a, b) => b.count - a.count)
      }

      return {
        total: rows.length,
        communities,
      }
    },
    staleTime: 300_000,
  })
}
