export interface User {
  id: string
  name: string
  email: string
  title: string | null
  role: 'user' | 'manager' | 'admin'
  is_active: boolean
  picture: string | null
  last_login: string | null
  created_at_source: string | null
  updated_at_source: string | null
}
