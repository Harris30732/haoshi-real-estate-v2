import { API_BASE, ENDPOINTS } from './constants'
import { Property, PropertyFormData } from '@/types/property'
import { Community } from '@/types/community'
import { useAuth } from '@/hooks/use-auth'

/** n8n webhook 呼叫的操作者標記（稽核用），取自目前登入者。 */
function getUser(): string {
  return useAuth.getState().profile?.full_name ?? 'unknown'
}

async function apiPost(endpoint: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

// ==================== Data Fetching ====================

export async function fetchAllData(): Promise<{
  properties: Property[]
  communities: Community[]
}> {
  const res = await fetch(`${API_BASE}${ENDPOINTS.ALL_DATA}`)
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  const data = await res.json()

  // Normalize: n8n may return different formats
  const properties = Array.isArray(data.properties_for_sale)
    ? data.properties_for_sale
    : Array.isArray(data.properties) ? data.properties : []
  const communities = Array.isArray(data.communities) ? data.communities : []

  return { properties, communities }
}

// ==================== Property CRUD ====================

export async function createProperty(data: PropertyFormData) {
  return apiPost(ENDPOINTS.PROPERTIES, {
    action: 'create',
    user: getUser(),
    data,
  })
}

export async function updateProperty(id: string, data: Partial<PropertyFormData>) {
  return apiPost(ENDPOINTS.PROPERTIES, {
    action: 'update',
    user: getUser(),
    id,
    data,
  })
}

export async function deleteProperty(id: string) {
  return apiPost(ENDPOINTS.PROPERTIES, {
    action: 'delete',
    user: getUser(),
    id,
  })
}

// ==================== Community CRUD ====================

export async function createCommunity(data: Partial<Community>) {
  return apiPost(ENDPOINTS.COMMUNITIES, {
    action: 'create',
    user: getUser(),
    data,
  })
}

export async function updateCommunity(id: string, data: Partial<Community>) {
  return apiPost(ENDPOINTS.COMMUNITIES, {
    action: 'update',
    user: getUser(),
    id,
    data,
  })
}

export async function deleteCommunity(id: string) {
  return apiPost(ENDPOINTS.COMMUNITIES, {
    action: 'delete',
    user: getUser(),
    id,
  })
}

// ==================== Photos ====================

export async function uploadPhotos(propertyId: string, files: File[]) {
  const formData = new FormData()
  formData.append('property_id', propertyId)
  formData.append('user', getUser())
  files.forEach(f => formData.append('file', f))

  const res = await fetch(`${API_BASE}${ENDPOINTS.PHOTOS}`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
  return res.json()
}
