'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useStoresForRegistration } from '@/hooks/use-stores'
import { useMyRegistrationRequest, useSubmitRegistration } from '@/hooks/use-registration-requests'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import toast from 'react-hot-toast'

function FullScreen({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center p-4">{children}</div>
}

export default function RegisterPage() {
  const router = useRouter()
  const { authState, isLoading, authEmail, authName } = useAuth()
  const myReq = useMyRegistrationRequest()
  const stores = useStoresForRegistration()
  const submit = useSubmitRegistration()

  const [storeId, setStoreId] = useState('')
  const [editedName, setEditedName] = useState<string | null>(null)
  const [phoneExt, setPhoneExt] = useState('')

  // 姓名預填 Google 帶回的值；使用者一旦編輯即以編輯值為準（衍生狀態，免 effect）。
  const fullName = editedName ?? authName ?? ''

  // 非 pending 狀態導離：anon/suspended → 登入頁、active → 首頁。
  useEffect(() => {
    if (isLoading) return
    if (authState === 'anon' || authState === 'suspended') router.replace('/login')
    else if (authState === 'active') router.replace('/')
  }, [authState, isLoading, router])

  // 已有待審申請 → 待審核頁。
  useEffect(() => {
    if (myReq.data?.status === 'pending') router.replace('/pending')
  }, [myReq.data, router])

  if (isLoading || authState !== 'pending' || myReq.isLoading || myReq.data?.status === 'pending') {
    return (
      <FullScreen>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </FullScreen>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeId || !fullName.trim()) return
    if (!authEmail) {
      toast.error('無法取得 Google 帳號 Email，請重新登入')
      return
    }
    try {
      await submit.mutateAsync({
        storeId,
        fullName: fullName.trim(),
        email: authEmail,
        phoneExt: phoneExt.trim() || null,
      })
      router.replace('/pending')
    } catch {
      // useSubmitRegistration 的 onError 已顯示 toast。
    }
  }

  return (
    <FullScreen>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">申請加入</CardTitle>
          <CardDescription>填寫資料，送出後由所屬店店長審核</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="store">所屬店別</Label>
              <Select value={storeId} onValueChange={(v) => setStoreId(v ?? '')}>
                <SelectTrigger id="store" className="w-full">
                  <SelectValue placeholder="選擇店別" />
                </SelectTrigger>
                <SelectContent>
                  {(stores.data ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}（{s.code}）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fullName">姓名</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setEditedName(e.target.value)}
                maxLength={50}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={authEmail ?? ''} readOnly disabled />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phoneExt">分機（選填）</Label>
              <Input
                id="phoneExt"
                value={phoneExt}
                onChange={(e) => setPhoneExt(e.target.value)}
                maxLength={20}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submit.isPending || !storeId || !fullName.trim()}
            >
              {submit.isPending ? '送出中…' : '送出申請'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </FullScreen>
  )
}
