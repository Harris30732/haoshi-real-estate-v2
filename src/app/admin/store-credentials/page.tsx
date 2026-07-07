'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { useStores } from '@/hooks/use-stores'
import {
  useStoreCredentialStatus,
  useSetStoreCredentials,
} from '@/hooks/use-store-credentials'
import { PERMISSIONS } from '@/lib/constants'
import type { StoreCredentialStatus } from '@/types/scrape'

/** 憑證狀態 badge：未設定 / 驗證中 / 帳密異常 / 已驗證（/ 已設定 fallback）。 */
function StatusBadge({ status }: { status: StoreCredentialStatus | null }) {
  if (!status || !status.configured) return <Badge variant="outline">未設定</Badge>
  if (status.pending_validation) return <Badge variant="secondary">驗證中…</Badge>
  if (status.needs_refresh) return <Badge variant="destructive">帳密異常</Badge>
  if (status.validated_at) return <Badge variant="default">已驗證</Badge>
  return <Badge variant="secondary">已設定</Badge>
}

export default function StoreCredentialsPage() {
  const profile = useAuth((s) => s.profile)
  const isOwner = profile?.role_key === 'owner'
  const stores = useStores()

  // 店長固定自家店；Owner 由下拉選擇要設定哪一店。
  const [pickedStoreId, setPickedStoreId] = useState<string | null>(null)
  const storeId = isOwner ? pickedStoreId : (profile?.store_id ?? null)

  const status = useStoreCredentialStatus(storeId)
  const setCreds = useSetStoreCredentials()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async () => {
    if (!storeId || !username.trim() || !password) return
    try {
      await setCreds.mutateAsync({ storeId, username: username.trim(), password })
      setUsername('')
      setPassword('')
    } catch {
      /* onError 已 toast；清除密碼（不在記憶體殘留明文），保留帳號供重試 */
      setPassword('')
    }
  }

  return (
    <AppShell title="YCUT 帳號設定" requiredPermission={PERMISSIONS.STORE_MANAGE_CREDENTIALS}>
      <div className="mx-auto max-w-xl space-y-4">
        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle>選擇店別</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={pickedStoreId ?? ''} onValueChange={setPickedStoreId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="請選擇要設定 YCUT 帳號的店別" />
                </SelectTrigger>
                <SelectContent>
                  {(stores.data ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}（{s.code}）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {!storeId ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {isOwner ? '請先選擇店別。' : '您的帳號尚未歸屬店別。'}
          </p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>YCUT 登入憑證</span>
                {status.isLoading ? (
                  <span className="text-xs font-normal text-muted-foreground">讀取中…</span>
                ) : (
                  <StatusBadge status={status.data ?? null} />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {status.data?.configured && (
                <p className="text-xs text-muted-foreground">
                  目前帳號：{status.data.ycut_username ?? '—'}
                  {status.data.rotated_at &&
                    `；更新於 ${new Date(status.data.rotated_at).toLocaleString('zh-TW')}`}
                  {status.data.validated_at &&
                    `；驗證通過於 ${new Date(status.data.validated_at).toLocaleString('zh-TW')}`}
                </p>
              )}
              {status.data?.pending_validation && (
                <p className="text-xs text-muted-foreground">
                  系統正在以此帳密測試 YCUT 登入（約 30 秒～1 分鐘），驗證通過後會自動恢復謄本抓取。
                </p>
              )}
              {status.data?.needs_refresh && (
                <p className="text-xs text-destructive">
                  此帳密驗證失敗，該店謄本抓取已暫停；請重新輸入正確帳密。
                  {status.data.validation_error && `原因：${status.data.validation_error}`}
                </p>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="ycutUsername">YCUT 帳號</Label>
                <Input
                  id="ycutUsername"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={200}
                  autoComplete="off"
                  placeholder="輸入新的 YCUT 帳號"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ycutPassword">YCUT 密碼</Label>
                <Input
                  id="ycutPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={400}
                  autoComplete="new-password"
                  placeholder="輸入新的 YCUT 密碼"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                密碼經加密儲存，設定後無法讀回；如需更換請重新輸入整組帳密。
              </p>
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={setCreds.isPending || !username.trim() || !password}
                >
                  {setCreds.isPending ? '儲存中…' : '儲存憑證'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
