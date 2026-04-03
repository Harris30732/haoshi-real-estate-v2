'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Transcript } from '@/types/transcript'

export function useTranscripts(communityName?: string) {
  return useQuery({
    queryKey: ['transcripts', communityName],
    queryFn: async () => {
      let query = supabase
        .from('transcripts')
        .select('*')
        .order('community_name', { ascending: true })
        .order('community_address', { ascending: true })

      if (communityName) {
        query = query.eq('community_name', communityName)
      }

      // Limit to 500 per page for performance
      query = query.limit(500)

      const { data, error } = await query
      if (error) throw error
      return (data || []) as Transcript[]
    },
    staleTime: 120_000,
  })
}

export function useTranscriptStats() {
  return useQuery({
    queryKey: ['transcript-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transcripts')
        .select('community_name')

      if (error) throw error

      const rows = data || []
      const communityMap: Record<string, number> = {}
      rows.forEach((r) => {
        const name = r.community_name || '未知'
        communityMap[name] = (communityMap[name] || 0) + 1
      })

      return {
        total: rows.length,
        communities: Object.entries(communityMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
      }
    },
    staleTime: 300_000,
  })
}
