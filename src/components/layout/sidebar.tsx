'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Home,
  FileText,
  BarChart3,
  Users,
  ClipboardList,
  Store,
  KeyRound,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { APP_NAME, PERMISSIONS } from '@/lib/constants'
import { useAuth } from '@/hooks/use-auth'
import { useMyPermissions } from '@/hooks/use-permissions'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  /** 需具備此功能權限才顯示。 */
  permission?: string
  /** 僅 Owner 可見。 */
  ownerOnly?: boolean
  /** active 判定用精確比對（href 為其他項目的前綴時需設此旗標）。 */
  exact?: boolean
}

const mainNav: NavItem[] = [
  { href: '/', label: '儀表板', icon: LayoutDashboard },
  { href: '/properties', label: '物件管理', icon: Home },
  { href: '/communities', label: '社區管理', icon: Building2, permission: PERMISSIONS.COMMUNITIES_VIEW },
  { href: '/transcripts', label: '謄本資料', icon: FileText, permission: PERMISSIONS.TRANSCRIPTS_VIEW },
  { href: '/analytics', label: '數據分析', icon: BarChart3 },
]

const adminNav: NavItem[] = [
  { href: '/admin/registrations', label: '待審核申請', icon: ClipboardList, permission: PERMISSIONS.STORE_MANAGE_MEMBERS },
  { href: '/admin/members', label: '成員管理', icon: Users, permission: PERMISSIONS.STORE_MANAGE_MEMBERS },
  { href: '/admin/store-credentials', label: 'YCUT 帳號設定', icon: KeyRound, permission: PERMISSIONS.STORE_MANAGE_CREDENTIALS },
  { href: '/admin/stores', label: '店別管理', icon: Store, ownerOnly: true },
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const profile = useAuth((s) => s.profile)
  const permissions = useMyPermissions()
  const isOwner = profile?.role_key === 'owner'

  // Owner 看全部；其餘依 ownerOnly / permission 過濾。
  const canSee = (item: NavItem) => {
    if (isOwner) return true
    if (item.ownerOnly) return false
    if (item.permission) return permissions.has(item.permission)
    return true
  }

  const visibleMain = mainNav.filter(canSee)
  const visibleAdmin = adminNav.filter(canSee)

  const renderItem = (item: NavItem) => {
    const isActive =
      item.href === '/' || item.exact
        ? pathname === item.href
        : pathname.startsWith(item.href)
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          collapsed && 'justify-center px-2',
        )}
        title={collapsed ? item.label : undefined}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    )
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-14 items-center border-b px-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              好
            </div>
            {!collapsed && (
              <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-2">
          {visibleMain.map(renderItem)}

          {visibleAdmin.length > 0 && (
            <>
              <Separator className="my-2" />
              {visibleAdmin.map(renderItem)}
            </>
          )}
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn('w-full', collapsed ? 'px-2' : 'justify-start')}
            onClick={onToggle}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>收合</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  )
}
