import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  User,
  Bell,
  Shield,
  Palette,
  Moon,
  Sun,
  Globe,
  Mail,
  Lock,
  Save,
  Smartphone
} from 'lucide-react';

import { useAuth, usePreferences } from '../stores/appStore';
import { useNotifications } from '../hooks/useNotifications';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { preferences, updatePreferences } = usePreferences();
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading: notificationsLoading,
    subscribe,
    unsubscribe,
  } = useNotifications();

  const [darkMode, setDarkMode] = useState(preferences.theme === 'dark');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  // Sincronizar estado local com store
  React.useEffect(() => {
    setDarkMode(preferences.theme === 'dark');
  }, [preferences.theme]);

  const handleSave = async () => {
    try {
      const newTheme = darkMode ? 'dark' : 'light';
      updatePreferences({ theme: newTheme });

      if (user) {
        const { error } = await supabase
          .from('users')
          .update({ theme: newTheme })
          .eq('id', user.id);

        if (error) throw error;
      }

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Configurações
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie suas preferências e configurações da conta
          </p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Perfil */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Perfil do Usuário</CardTitle>
            </div>
            <CardDescription>
              Informações básicas da sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                ) : (
                  <span>{user?.fullName?.substring(0, 2).toUpperCase() || 'US'}</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">{user?.fullName || 'Usuário'}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email || 'email@exemplo.com'}</p>
              </div>
              <Button variant="outline" size="sm">
                Editar Perfil
              </Button>
            </div>

            <Separator />

            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">Email</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">Idioma</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Português (Brasil)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aparência */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle>Aparência</CardTitle>
            </div>
            <CardDescription>
              Personalize a interface do aplicativo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <Label htmlFor="dark-mode" className="font-medium">Modo Escuro</Label>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Alterna entre tema claro e escuro
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Notificações</CardTitle>
            </div>
            <CardDescription>
              Gerencie como você recebe atualizações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notif" className="font-medium">Email</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receber notificações por email
                </p>
              </div>
              <Switch
                id="email-notif"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <Label htmlFor="push-notif" className="font-medium">Notificações Push (PWA)</Label>
                  {isSubscribed && (
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                      Ativo
                    </Badge>
                  )}
                  {!isSupported && (
                    <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-500 border-orange-500/20">
                      Não Suportado
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isSupported
                    ? 'Receber notificações push mesmo quando o app está fechado'
                    : 'Seu navegador não suporta notificações push'
                  }
                </p>
                {isSubscribed && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Status da permissão: {permission}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {notificationsLoading && <Spinner className="h-4 w-4" />}
                {isSupported && (
                  <Button
                    size="sm"
                    variant={isSubscribed ? 'outline' : 'default'}
                    onClick={isSubscribed ? unsubscribe : subscribe}
                    disabled={notificationsLoading}
                  >
                    {isSubscribed ? 'Desativar' : 'Ativar'}
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="task-remind" className="font-medium">Lembretes de Tarefas</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Alertas para tarefas próximas do vencimento
                </p>
              </div>
              <Switch
                id="task-remind"
                checked={taskReminders}
                onCheckedChange={setTaskReminders}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weekly-report" className="font-medium">Relatório Semanal</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Resumo semanal de produtividade
                </p>
              </div>
              <Switch
                id="weekly-report"
                checked={weeklyReport}
                onCheckedChange={setWeeklyReport}
              />
            </div>
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Segurança</CardTitle>
            </div>
            <CardDescription>
              Proteja sua conta e dados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-gray-500" />
                <div className="space-y-0.5">
                  <Label className="font-medium">Senha</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Última alteração: há 30 dias
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Alterar Senha
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-medium">Autenticação em Duas Etapas</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Adicione uma camada extra de segurança
                </p>
              </div>
              <Button variant="outline" size="sm">
                Configurar
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="font-medium">Sessões Ativas</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                1 dispositivo conectado
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Gerenciar Sessões
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
