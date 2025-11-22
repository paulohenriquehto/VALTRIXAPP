import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  ChevronRight
} from 'lucide-react';
import { useUI } from '../stores/appStore';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/tasks', label: 'Tarefas', icon: CheckSquare },
  { path: '/calendar', label: 'Calendário', icon: Calendar },
  { path: '/clients', label: 'Clientes', icon: Building2 },
  { path: '/projects', label: 'Projetos', icon: FolderKanban },
  { path: '/tags', label: 'Tags', icon: Tag },
  { path: '/team', label: 'Equipe', icon: Users },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/pomodoro', label: 'Pomodoro', icon: Clock },
  { path: '/pricing', label: 'Planos', icon: Crown },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { sidebarCollapsed: sidebarOpen } = useUI();

  return (
    <aside className={`fixed left-0 top-16 bottom-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-40 ${
      sidebarOpen ? 'w-64' : 'w-16'
    }`}>
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={!sidebarOpen ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <>
                  <span className="font-medium">{item.label}</span>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              )}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
};

export default Sidebar;