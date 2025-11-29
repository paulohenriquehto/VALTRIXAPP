import * as React from "react"
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  CheckSquare,
  Calendar,
  Building2,
  FolderKanban,
  Tag,
  Users,
  BarChart3,
  Clock,
  Crown,
  Target,
  TrendingUp,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
} from '@/components/ui/sidebar'

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/tasks', label: 'Tarefas', icon: CheckSquare },
  { path: '/calendar', label: 'Calendário', icon: Calendar },
  { path: '/prospects', label: 'Pipeline', icon: Target },
  { path: '/comercial', label: 'Comercial', icon: TrendingUp },
  { path: '/clients', label: 'Clientes', icon: Building2 },
  { path: '/projects', label: 'Projetos', icon: FolderKanban },
  { path: '/tags', label: 'Tags', icon: Tag },
  { path: '/team', label: 'Equipe', icon: Users },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/pomodoro', label: 'Pomodoro', icon: Clock },
  { path: '/pricing', label: 'Planos', icon: Crown },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Home className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Valtrixapp</span>
                  <span className="text-xs">Sistema de Gestão</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path ||
                                location.pathname.startsWith(item.path + '/')

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link to={item.path}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
              <span className="flex-1">Valtrixapp © 2025</span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
