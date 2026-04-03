export interface Property {
  id: string
  community_name: string
  total_price: number | null
  total_ping: number | null
  parking_ping: number | null
  parking_price: number | null
  floor_info: string | null
  address: string | null
  status: string
  contract_type: string | null
  consignor: string | null
  layout: string | null
  notes: string | null
  agent: string | null
  maintainer: string | null
  photo_paths: string[] | null
  cover_photo_path: string | null

  // Area breakdown
  main_area_ping: number | null
  accessory_area_ping: number | null
  public_area_ping: number | null

  // Ownership (from transcript)
  current_owner: string | null
  registration_date: string | null
  registration_reason: string | null
  mortgage_amount: number | null
  rights_type: string | null
  transcript_id: string | null

  // Scoring
  property_score: number | null

  // Cross-reference
  data_sources: Record<string, string> | null

  // Timestamps
  created_at_source: string | null
  updated_at_source: string | null

  // Computed (frontend)
  house_ping?: number
  unit_price?: number
  age?: number
}

export interface PropertyFormData {
  community_name: string
  total_price: number | null
  total_ping: number | null
  parking_ping: number | null
  parking_price: number | null
  floor_info: string
  address: string
  status: string
  contract_type: string
  consignor: string
  layout: string
  notes: string
}
