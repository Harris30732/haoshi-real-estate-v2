'use client'

import { Menu, Sun, Moon, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/hooks/use-theme'
import { useAuth } from '@/hooks/use-auth'
import { useMyStore } from '@/hooks/use-stores'
import { useRouter } from 'next/navigation'
import { ROLE_LABELS } from '@/lib/constants'

interface HeaderProps {
  onMenuClick: () => void
  title?: string
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const { profile, signOut } = useAuth()
  const myStore = useMyStore()
  const router = useRouter()

  // 「店名 · 角色」識別字串；未綁店（如 Owner）只顯示角色。
  const identityLine = [myStore.data?.name, ROLE_LABELS[profile?.role_key ?? 'employee']]
    .filter(Boolean)
    .join(' · ')

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page title */}
      {title && (
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      )}

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>

        {/* 登入身分：哪家店的誰（純顯示、不可點，手機收進頭像選單） */}
        <div className="hidden select-none text-right leading-tight sm:block">
          <p className="text-sm font-medium">{profile?.full_name || '使用者'}</p>
          <p className="text-xs text-muted-foreground">{identityLine}</p>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" className="relative h-8 w-8 rounded-full" />}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{profile?.full_name || '使用者'}</p>
              <p className="text-xs text-muted-foreground">{identityLine}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>個人設定</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>登出</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
