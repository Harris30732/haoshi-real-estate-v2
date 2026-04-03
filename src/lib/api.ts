import { API_BASE, ENDPOINTS } from './constants'
import { Property, PropertyFormData } from '@/types/property'
import { Community } from '@/types/community'
import { User } from '@/types/user'
import { AUTH_CONFIG } from './auth-config'

function getUser(): string {
  try {
    const stored = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.USER)
    if (stored) {
      const user = JSON.parse(stored)
      return user.name || 'unknown'
    }
  } catch { /* ignore */ }
  return 'unknown'
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
  users: User[]
}> {
  const res = await fetch(`${API_BASE}${ENDPOINTS.ALL_DATA}`)
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  const data = await res.json()

  // Normalize: n8n may return different formats
  const properties = Array.isArray(data.properties_for_sale)
    ? data.properties_for_sale
    : Array.isArray(data.properties) ? data.properties : []
  const communities = Array.isArray(data.communities) ? data.communities : []
  const users = Array.isArray(data.users) ? data.users : []

  return { properties, communities, users }
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

// ==================== User CRUD ====================

export async function createUser(data: Partial<User>) {
  return apiPost(ENDPOINTS.USERS, {
    action: 'create',
    user: getUser(),
    data,
  })
}

export async function updateUser(id: string, data: Partial<User>) {
  return apiPost(ENDPOINTS.USERS, {
    action: 'update',
    user: getUser(),
    id,
    data,
  })
}

export async function deleteUser(id: string) {
  return apiPost(ENDPOINTS.USERS, {
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
