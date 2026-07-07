'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useMyInvite, useAcceptInvite } from '@/hooks/use-invites'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ROLE_LABELS } from '@/lib/constants'

function FullScreen({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">{children}</div>
}

/**
 * 加入頁（P4-Auth：Email 預先邀請）。pending 使用者（已 Google 登入、尚無 profile）的入口：
 * - 有 pending 邀請 → 顯示店名/角色，確認加入（可改顯示名）→ accept → refreshSession → 導首頁
 * - 無邀請 → 死路「帳號尚未授權，請聯絡管理員」+ 登出
 */
export default function RegisterPage() {
  const router = useRouter()
  const { authState, isLoading, authEmail, authName, signOut } = useAuth()
  const myInvite = useMyInvite()
  const accept = useAcceptInvite()

  const [editedName, setEditedName] = useState<string | null>(null)
  const fullName = editedName ?? myInvite.data?.full_name ?? authName ?? ''

  // 非 pending 狀態導離：anon/suspended → 登入頁、active → 首頁。
  useEffect(() => {
    if (isLoading) return
    if (authState === 'anon' || authState === 'suspended') router.replace('/login')
    else if (authState === 'active') router.replace('/')
  }, [authState, isLoading, router])

  const handleSignOut = async () => {
    await signOut()
    router.replace('/login')
  }

  const handleAccept = async () => {
    try {
      await accept.mutateAsync({ fullName })
      // accept 成功後 refreshSession 觸發 onAuthStateChange → syncProfile → active；
      // 上方 effect 會在 authState 變 active 時導向首頁。保險起見也主動推一次。
      router.replace('/')
    } catch {
      // useAcceptInvite 的 onError 已顯示 toast。
    }
  }

  // 載入中（含 pending 但邀請查詢未回）顯示 spinner。
  if (isLoading || authState !== 'pending' || myInvite.isLoading) {
    return (
      <FullScreen>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </FullScreen>
    )
  }

  // 無邀請 → 死路。
  if (!myInvite.data) {
    return (
      <FullScreen>
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">尚未開通</CardTitle>
            <CardDescription>您的帳號尚未被授權加入系統</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
              <p className="text-muted-foreground">登入帳號</p>
              <p className="break-all">{authEmail}</p>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              請將此 Email 提供給您的店長或系統管理員，由對方在後台發送邀請後，再用此 Google 帳號登入即可加入。
            </p>
            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              登出
            </Button>
          </CardContent>
        </Card>
      </FullScreen>
    )
  }

  // 有邀請 → 確認加入。
  const inv = myInvite.data
  return (
    <FullScreen>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">確認加入</CardTitle>
          <CardDescription>您已被邀請加入，請確認資料後加入系統</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border p-3 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">所屬店別</span>
              <span className="font-medium">{inv.store_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">角色</span>
              <span className="font-medium">{ROLE_LABELS[inv.role_key]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="break-all">{authEmail}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fullName">您的姓名</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setEditedName(e.target.value)}
              maxLength={50}
              placeholder="請輸入姓名"
            />
          </div>

          <Button
            className="w-full"
            onClick={handleAccept}
            disabled={accept.isPending || !fullName.trim()}
          >
            {accept.isPending ? '加入中…' : '確認加入'}
          </Button>
          <Button variant="ghost" className="w-full" onClick={handleSignOut} disabled={accept.isPending}>
            這不是我，登出
          </Button>
        </CardContent>
      </Card>
    </FullScreen>
  )
}
