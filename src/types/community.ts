export interface Community {
  id: string
  builder: string | null
  community_name: string
  completion_date: string | null
  total_units: string | null
  unit_area_range: string | null
  address: string | null
  elementary_school: string | null
  junior_high_school: string | null
  holding_rate: number | null
  price_range_low: number | null
  price_range_high: number | null
  room_stats: Record<string, number> | null
  total_transcript_records: number | null
  photo_paths: string[] | null
  created_at_source: string | null
  updated_at_source: string | null

  // Computed
  age?: number
}
