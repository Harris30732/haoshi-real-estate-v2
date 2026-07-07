'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Legacy 路由。P4-Auth（Email 預先邀請）後「等待審核」概念消失：
 * pending 使用者一律走 /register（有邀請→確認加入 / 無邀請→死路）。
 * 保留此檔避免舊連結 404，直接轉址。
 */
export default function PendingPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/register')
  }, [router])
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}
