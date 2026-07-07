'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useMyPermissions, useMyPermissionsReady } from '@/hooks/use-permissions'
import type { Role } from '@/types/user'

/** 角色高低（數字越小權限越高）。owner > manager > employee。 */
const ROLE_RANK: Record<Role, number> = { owner: 0, manager: 1, employee: 2 }

interface AuthGuardProps {
  children: React.ReactNode
  /** 最低角色門檻：未達門檻者顯示「無權限」畫面。未指定則任何 active 使用者皆可進。 */
  requiredRole?: Role
  /** 最低功能權限門檻：缺此權限者顯示「無權限」畫面。安全邊界仍是 DB 端 RLS / RPC。 */
  requiredPermission?: string
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">載入中...</p>
      </div>
    </div>
  )
}

function NoAccessScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center">
        <p className="text-lg font-semibold">無存取權限</p>
        <p className="mt-1 text-sm text-muted-foreground">此頁面僅限特定角色／權限存取，請聯絡店長。</p>
      </div>
    </div>
  )
}

/**
 * 受保護頁面的守門元件。安全邊界靠 P0 RLS；此處只做導向與 UX gating。
 * 依 Supabase session 推導的 authState 導向：
 *   anon → /login、pending → /register、suspended → /login（登入頁顯示停用提示）。
 */
export function AuthGuard({ children, requiredRole, requiredPermission }: AuthGuardProps) {
  const router = useRouter()
  const { authState, profile, isLoading } = useAuth()
  const permissions = useMyPermissions()
  const permissionsReady = useMyPermissionsReady()

  useEffect(() => {
    if (isLoading) return
    if (authState === 'anon') router.replace('/login')
    else if (authState === 'pending') router.replace('/register')
    else if (authState === 'suspended') router.replace('/login')
  }, [authState, isLoading, router])

  if (isLoading) return <LoadingScreen />

  // 非 active：導向 effect 已觸發，此處不渲染內容。
  if (authState !== 'active' || !profile) return null

  // 角色 gating：使用者角色權限低於頁面要求 → 無權限畫面。
  if (requiredRole && ROLE_RANK[profile.role_key] > ROLE_RANK[requiredRole]) {
    return <NoAccessScreen />
  }

  // 功能權限 gating：權限尚在載入時先顯示載入畫面，避免誤判閃爍。
  if (requiredPermission) {
    if (!permissionsReady) return <LoadingScreen />
    if (!permissions.has(requiredPermission)) return <NoAccessScreen />
  }

  return <>{children}</>
}
