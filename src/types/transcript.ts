// P2 schema: transcripts 不再含 community_name / community_address 直接欄位
// community 屬性由 communities 表 JOIN 進來；hook 攤平到頂層方便 UI 使用
export interface Transcript {
  id: string
  community_id: string
  ycut_object_key: string
  source_updated_at: string | null
  community_name?: string  // 從 communities JOIN（hook 攤平）
  community_address?: string | null  // 從 communities JOIN
  // ── 以下也是 communities JOIN 攤平的社區介紹欄位（migration 20260527100001）──
  community_builder?: string | null
  community_completion_date?: string | null
  community_building_floors?: string | null
  community_total_units?: number | null
  community_units_per_floor?: string | null
  community_ping_range?: string | null
  community_layout_plan?: string | null
  community_building_type?: string | null
  community_management_type?: string | null
  community_main_structure?: string | null
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
  created_at?: string
  updated_at?: string
}
