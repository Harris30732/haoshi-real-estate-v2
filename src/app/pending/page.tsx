'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useMyRegistrationRequest } from '@/hooks/use-registration-requests'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function PendingPage() {
  const router = useRouter()
  const { authState, isLoading, signOut } = useAuth()
  const myReq = useMyRegistrationRequest()

  // 非 pending 狀態導離。
  useEffect(() => {
    if (isLoading) return
    if (authState === 'anon' || authState === 'suspended') router.replace('/login')
    else if (authState === 'active') router.replace('/')
  }, [authState, isLoading, router])

  // pending 但沒有待審申請（未申請 / 曾被駁回）→ 回申請頁。
  useEffect(() => {
    if (!myReq.isLoading && authState === 'pending' && myReq.data?.status !== 'pending') {
      router.replace('/register')
    }
  }, [myReq.isLoading, myReq.data, authState, router])

  const handleSignOut = async () => {
    await signOut()
    router.replace('/login')
  }

  if (isLoading || authState !== 'pending' || myReq.isLoading || myReq.data?.status !== 'pending') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const submittedAt = new Date(myReq.data.created_at).toLocaleString('zh-TW')

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">申請審核中</CardTitle>
          <CardDescription>您的加入申請已送出，請等待店長審核</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
            <p className="text-muted-foreground">送出時間</p>
            <p>{submittedAt}</p>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            審核通過後即可使用系統。如長時間未獲審核，請聯絡店長。
          </p>
          <Button variant="outline" className="w-full" onClick={handleSignOut}>
            登出
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
