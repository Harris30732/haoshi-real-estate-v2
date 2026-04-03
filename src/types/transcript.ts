export interface Transcript {
  id: string
  community_name: string
  community_address: string | null
  owner_address: string | null
  owner_name: string | null
  pdf_url: string | null
  land_section: string | null
  area_ping: number | null
  application_date: string | null
  id_prefix: string | null
  registration_reason: string | null
  registration_date: string | null
  registration_order: string | null
  rights_type: string | null
  mortgage_total: number | null
  total_ping: number | null
  building_ping: number | null
  main_area_ping: number | null
  accessory_area_ping: number | null
  public_area_ping: number | null
  parking_area_ping: number | null
  public_common: string | null
  public_rights_scope: string | null
  parking_number: string | null
  parking_rights_scope: string | null
  small_public_area: string | null
  small_public_rights: string | null
  extracted_date: string | null
}
