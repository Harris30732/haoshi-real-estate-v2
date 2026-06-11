'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { AuthGuard } from './auth-guard'
import { YcutCredentialGate } from './ycut-credential-gate'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import type { Role } from '@/types/user'

interface AppShellProps {
  children: React.ReactNode
  title?: string
  /** 頁面最低角色門檻，透傳給 AuthGuard 做 gating。 */
  requiredRole?: Role
  /** 頁面最低功能權限門檻，透傳給 AuthGuard 做 gating。 */
  requiredPermission?: string
}

export function AppShell({ children, title, requiredRole, requiredPermission }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Collapse sidebar on tablet
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <AuthGuard requiredRole={requiredRole} requiredPermission={requiredPermission}>
    <YcutCredentialGate />
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div
        className={cn(
          'flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'
        )}
      >
        <Header
          onMenuClick={() => setMobileOpen(true)}
          title={title}
        />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
    </AuthGuard>
  )
}
