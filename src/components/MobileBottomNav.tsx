import * as React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  CheckSquare,
  Calendar,
  Building2,
  MoreHorizontal,
  FolderKanban,
  Tag,
  Users,
  BarChart3,
  Clock,
  Crown,
  Settings,
  User,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAIChat } from '@/stores/aiChatStore'

// Primary nav items shown in bottom bar
const primaryNavItems = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/tasks', label: 'Tarefas', icon: CheckSquare },
  { path: '/calendar', label: 'Agenda', icon: Calendar },
  { path: '/clients', label: 'Clientes', icon: Building2 },
]

// Secondary nav items shown in "More" sheet
const secondaryNavItems = [
  { path: '/projects', label: 'Projetos', icon: FolderKanban },
  { path: '/tags', label: 'Tags', icon: Tag },
  { path: '/team', label: 'Equipe', icon: Users },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/pomodoro', label: 'Pomodoro', icon: Clock },
  { path: '/pricing', label: 'Planos', icon: Crown },
  { path: '/settings', label: 'Configurações', icon: Settings },
  { path: '/profile', label: 'Perfil', icon: User },
]

interface NavItemProps {
  path: string
  label: string
  icon: React.ElementType
  isActive: boolean
  onClick?: () => void
}

function NavItem({ path, label, icon: Icon, isActive, onClick }: NavItemProps) {
  return (
    <Link
      to={path}
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-[64px] transition-colors',
        isActive
          ? 'text-primary'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </Link>
  )
}

function MoreSheetItem({ path, label, icon: Icon, isActive, onClick }: NavItemProps) {
  return (
    <Link
      to={path}
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 px-4 py-3 rounded-lg transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'hover:bg-muted text-foreground'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </Link>
  )
}

export function MobileBottomNav() {
  const location = useLocation()
  const isMobile = useIsMobile()
  const [moreSheetOpen, setMoreSheetOpen] = React.useState(false)
  const { toggleOpen: toggleAI, isOpen: isAIOpen, unreadInsights } = useAIChat()

  // Only render on mobile
  if (!isMobile) return null

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  // Check if any secondary item is active
  const isMoreActive = secondaryNavItems.some((item) => isActive(item.path))

  return (
    <>
      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-16 lg:hidden" />

      {/* Bottom Navigation Bar - visible on mobile and tablet (< 1024px) */}
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 lg:hidden',
          'bg-background/95 backdrop-blur-lg border-t',
          'pb-safe-bottom'
        )}
      >
        <div className="flex items-center justify-around h-16">
          {primaryNavItems.map((item) => (
            <NavItem
              key={item.path}
              {...item}
              isActive={isActive(item.path)}
            />
          ))}

          {/* AI Manager Button */}
          <button
            onClick={toggleAI}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-[64px] transition-colors relative',
              isAIOpen
                ? 'text-amber-500'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="relative">
              <Sparkles className="h-5 w-5" />
              {unreadInsights > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium leading-none">AI</span>
          </button>

          {/* More Button with Sheet */}
          <Sheet open={moreSheetOpen} onOpenChange={setMoreSheetOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-[64px] transition-colors',
                  isMoreActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <MoreHorizontal className="h-5 w-5" />
                <span className="text-[10px] font-medium leading-none">Mais</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl">
              <SheetHeader className="pb-4">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-1 gap-1 pb-safe-bottom">
                {secondaryNavItems.map((item) => (
                  <MoreSheetItem
                    key={item.path}
                    {...item}
                    isActive={isActive(item.path)}
                    onClick={() => setMoreSheetOpen(false)}
                  />
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  )
}
