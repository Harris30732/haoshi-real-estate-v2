'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AUTH_CONFIG } from '@/lib/auth-config'
import Script from 'next/script'

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, login, loginDemo, checkAuth } = useAuth()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  const handleGoogleCallback = async (response: { credential: string }) => {
    try {
      await login(response.credential)
      router.push('/')
    } catch {
      // Fallback to demo mode
      loginDemo()
      router.push('/')
    }
  }

  const initGoogle = () => {
    if (typeof window !== 'undefined' && window.google?.accounts) {
      window.google.accounts.id.initialize({
        client_id: AUTH_CONFIG.GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
      })
      const btnContainer = document.getElementById('google-btn')
      if (btnContainer) {
        window.google.accounts.id.renderButton(btnContainer, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'signin_with',
          locale: 'zh-TW',
        })
      }
    }
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        onLoad={initGoogle}
        strategy="afterInteractive"
      />
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
            {/* Google Sign-In Button */}
            <div id="google-btn" className="flex justify-center" />

            {/* Demo Login */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">或</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                loginDemo()
                router.push('/')
              }}
            >
              Demo 模式登入
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Demo 模式可體驗所有功能
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

// Extend Window for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void
          prompt: () => void
        }
      }
    }
  }
}
