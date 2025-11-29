import * as React from "react";
import { Link, useLocation } from "react-router-dom";
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
  Settings,
  User,
  Target,
  TrendingUp,
} from "lucide-react";
import { Dock, DockIcon, DockSeparator, DockLabel } from "@/components/ui/dock";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AIDockButton } from "@/components/ai";

// Navigation items for the dock
const primaryNavItems = [
  { path: "/dashboard", label: "Dashboard", icon: Home },
  { path: "/tasks", label: "Tarefas", icon: CheckSquare },
  { path: "/calendar", label: "Calendário", icon: Calendar },
  { path: "/prospects", label: "Pipeline", icon: Target },
  { path: "/comercial", label: "Comercial", icon: TrendingUp },
  { path: "/clients", label: "Clientes", icon: Building2 },
  { path: "/projects", label: "Projetos", icon: FolderKanban },
];

const secondaryNavItems = [
  { path: "/tags", label: "Tags", icon: Tag },
  { path: "/team", label: "Equipe", icon: Users },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/pomodoro", label: "Pomodoro", icon: Clock },
  { path: "/pricing", label: "Planos", icon: Crown },
];

const utilityNavItems = [
  { path: "/settings", label: "Configurações", icon: Settings },
  { path: "/profile", label: "Perfil", icon: User },
];

interface DockNavItemProps {
  path: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
}

function DockNavItem({ path, label, icon: Icon, isActive }: DockNavItemProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to={path}>
            <DockIcon isActive={isActive} className="group relative">
              <Icon className={cn("w-5 h-5 transition-all", isActive && "scale-110")} />
            </DockIcon>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function DesktopDock() {
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 hidden lg:block">
      <Dock
        iconSize={36}
        magnification={52}
        distance={100}
        className="border-border/50"
      >
        {/* Primary Navigation */}
        {primaryNavItems.map((item) => (
          <DockNavItem
            key={item.path}
            {...item}
            isActive={isActive(item.path)}
          />
        ))}

        <DockSeparator />

        {/* Secondary Navigation */}
        {secondaryNavItems.map((item) => (
          <DockNavItem
            key={item.path}
            {...item}
            isActive={isActive(item.path)}
          />
        ))}

        <DockSeparator />

        {/* AI Manager Button */}
        <AIDockButton />

        <DockSeparator />

        {/* Utility Navigation */}
        {utilityNavItems.map((item) => (
          <DockNavItem
            key={item.path}
            {...item}
            isActive={isActive(item.path)}
          />
        ))}
      </Dock>
    </div>
  );
}
