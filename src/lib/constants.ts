export const APP_NAME = '好市房產'

export const API_BASE = '/api'

export const ENDPOINTS = {
  ALL_DATA: '/all-data',
  PROPERTIES: '/admin/properties',
  COMMUNITIES: '/admin/communities',
  USERS: '/admin/users',
  PHOTOS: '/admin/photos/upload',
  AUTH_GOOGLE: '/auth/google',
  AUTH_VERIFY: '/auth/verify',
} as const

export const PROPERTY_STATUS = {
  FOR_SALE: '在售',
  DELISTED: '已下架',
  SOLD: '已成交',
} as const

export const CONTRACT_TYPES = {
  EXCLUSIVE: '專任',
  GENERAL: '一般',
  OWNER: '屋主',
  PENDING: '待確認',
} as const

export const LAYOUT_TYPES = [
  '套房', '兩房', '三房', '三房+1房', '四房', '四房以上',
] as const

export const USER_ROLES = {
  USER: 'user',
  MANAGER: 'manager',
  ADMIN: 'admin',
} as const

export const ROLE_LABELS: Record<string, string> = {
  user: '一般使用者',
  manager: '管理者',
  admin: '系統管理員',
}

export const PRICE_RANGES = [
  { label: '1000萬以下', min: 0, max: 1000 },
  { label: '1000-1500萬', min: 1000, max: 1500 },
  { label: '1500-2000萬', min: 1500, max: 2000 },
  { label: '2000-2500萬', min: 2000, max: 2500 },
  { label: '2500-3000萬', min: 2500, max: 3000 },
  { label: '3000萬以上', min: 3000, max: Infinity },
] as const

export const ITEMS_PER_PAGE = 20
