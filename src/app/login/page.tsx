'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const { authState, isLoading, loginWithGoogle } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 已登入者離開登入頁：active → 首頁、pending → 申請加入頁。
  useEffect(() => {
    if (isLoading) return
    if (authState === 'active') router.replace('/')
    else if (authState === 'pending') router.replace('/register')
  }, [authState, isLoading, router])

  const handleGoogleLogin = async () => {
    setError(null)
    setSubmitting(true)
    try {
      await loginWithGoogle()
      // signInWithOAuth 成功後瀏覽器會跳轉至 Google，後續由 redirect 回來接手。
    } catch (e) {
      setError(e instanceof Error ? e.message : '登入失敗，請稍後再試')
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold">
            好
          </div>
          <CardTitle className="text-xl">好市房產</CardTitle>
          <CardDescription>房屋物件管理系統</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {authState === 'suspended' && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
              此帳號已被停用，請聯絡店長。
            </p>
          )}

          <Button className="w-full" onClick={handleGoogleLogin} disabled={submitting}>
            {submitting ? '前往 Google 登入…' : '使用 Google 登入'}
          </Button>

          {error && <p className="text-center text-sm text-destructive">{error}</p>}

          <p className="text-center text-xs text-muted-foreground">
            尚未加入團隊？
            <Link href="/register" className="ml-1 underline underline-offset-2">
              申請加入
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
