import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Settings,
  LogOut,
  User,
  Sun,
  Moon,
  Search,
  Check,
  Trash2,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  X,
  Clock,
  BellOff,
  BellRing
} from 'lucide-react';
import { useAuth, useUI } from '../stores/appStore';
import { useNotifications } from '../stores/notificationStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Notification } from '../types';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuth();
  const { theme: darkMode, setTheme } = useUI();
  const isMobile = useIsMobile();
  const [searchOpen, setSearchOpen] = useState(false);

  // Notification store (dados reais do Supabase)
  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    permissionStatus,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
    subscribeToUpdates,
    unsubscribeFromUpdates,
    requestPushPermission,
    subscribeToPush,
    updatePermissionStatus,
  } = useNotifications();

  // Carregar notificações e configurar realtime ao montar
  useEffect(() => {
    if (user?.id) {
      fetchNotifications(user.id);
      subscribeToUpdates(user.id);
      updatePermissionStatus();

      return () => {
        unsubscribeFromUpdates();
      };
    }
  }, [user?.id]);

  const handleLogout = async () => {
    try {
      // Fazer signOut do Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Erro ao fazer logout do Supabase:', error);
      }

      // Limpar estado local
      clearAuth();

      // Redirecionar para login
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, limpar estado e redirecionar
      clearAuth();
      navigate('/login', { replace: true });
    }
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    if (user?.id) {
      markAllAsRead(user.id);
    }
  };

  const handleClearAllNotifications = () => {
    if (user?.id) {
      clearAll(user.id);
    }
  };

  const handleEnablePush = async () => {
    try {
      const permission = await requestPushPermission();
      if (permission === 'granted' && user?.id) {
        await subscribeToPush(user.id);
      }
    } catch (error) {
      console.error('Erro ao ativar notificações push:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
      case 'task_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
      case 'task_overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
      case 'task_due':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'task_assigned':
        return <User className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Agora';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min atrás`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atrás`;
    return `${Math.floor(seconds / 86400)}d atrás`;
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-lg px-4">
      {/* Barra de pesquisa - Responsiva */}
      {isMobile ? (
        <>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(!searchOpen)}
            className="mr-1"
          >
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>
          {searchOpen && (
            <div className="absolute top-16 left-0 right-0 p-3 bg-background border-b z-40 animate-in slide-in-from-top-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  autoFocus
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex justify-center px-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Pesquisar..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      )}

      {/* Ações do usuário */}
      <div className="flex items-center gap-2">
          {/* Toggle tema */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(darkMode === 'dark' ? 'light' : 'dark')}
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Notificações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-y-auto">
              <div className="flex items-center justify-between px-2 py-2">
                <DropdownMenuLabel className="p-0">Notificações</DropdownMenuLabel>
                {notifications.length > 0 && (
                  <div className="flex gap-1">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={handleMarkAllAsRead}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Marcar todas
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleClearAllNotifications}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Limpar
                    </Button>
                  </div>
                )}
              </div>

              {/* Banner para ativar notificações push */}
              {permissionStatus === 'default' && (
                <>
                  <div className="px-3 py-2 bg-blue-50 dark:bg-blue-950/30 border-y border-border/50">
                    <div className="flex items-center gap-2">
                      <BellRing className="h-4 w-4 text-blue-500" />
                      <p className="text-xs text-muted-foreground flex-1">
                        Ative notificações push para não perder prazos
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={handleEnablePush}
                      >
                        Ativar
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {permissionStatus === 'denied' && (
                <div className="px-3 py-2 bg-yellow-50 dark:bg-yellow-950/30 border-y border-border/50">
                  <div className="flex items-center gap-2">
                    <BellOff className="h-4 w-4 text-yellow-500" />
                    <p className="text-xs text-muted-foreground">
                      Notificações bloqueadas. Ative nas configurações do navegador.
                    </p>
                  </div>
                </div>
              )}

              <DropdownMenuSeparator />

              {notificationsLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                  <p>Carregando...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                    }`}
                    onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-2 w-full">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Menu do usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2 sm:px-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-r from-green-400 to-blue-500 text-white">
                    {user?.fullName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline">
                  {user?.fullName || 'Demo User'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={handleLogout}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;