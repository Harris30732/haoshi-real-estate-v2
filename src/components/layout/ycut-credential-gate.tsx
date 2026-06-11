'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { KeyRound } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useNeedsYcutCredentials } from '@/hooks/use-store-credentials'

const CRED_PATH = '/admin/store-credentials'

/**
 * 全站提示：店長自家店 YCUT 帳密「未設定」或「帳密異常（驗證失敗）」時，跳彈窗引導去設定頁。
 * - 只對店長（manager）觸發（見 useNeedsYcutCredentials）。
 * - 在設定頁本身不跳（CRED_PATH），避免擋住要操作的頁面。
 * - 可「稍後再說」關閉；因 AppShell 隨頁面 remount，換頁會再跳，直到設定完成。
 */
export function YcutCredentialGate() {
  const { needs, reason } = useNeedsYcutCredentials()
  const pathname = usePathname()
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)

  const show = needs && pathname !== CRED_PATH && !dismissed
  const invalid = reason === 'invalid'

  return (
    <Dialog open={show} onOpenChange={(v) => { if (!v) setDismissed(true) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className={`h-5 w-5 ${invalid ? 'text-destructive' : 'text-primary'}`} />
            {invalid ? 'YCUT 帳密異常' : '尚未設定 YCUT 帳號'}
          </DialogTitle>
          <DialogDescription className="pt-1 leading-relaxed">
            {invalid
              ? '您的店的永慶（YCUT）帳號登入驗證失敗（密碼錯誤或權限異常），謄本抓取已暫停。請重新設定正確的帳號密碼，驗證通過後會自動恢復抓取。'
              : '您的店還沒有設定永慶（YCUT）登入帳號，目前無法抓取謄本。請先新增 YCUT 帳號與密碼，設定完成後就能開始下單抓取。'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => setDismissed(true)}>
            稍後再說
          </Button>
          <Button onClick={() => { setDismissed(true); router.push(CRED_PATH) }}>
            前往設定 YCUT 帳號
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
