import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/services/notificationService';
import { useAuth } from '@/stores/appStore';
import { toast } from 'sonner';

export function useNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Verifica suporte e status inicial
  useEffect(() => {
    const checkStatus = async () => {
      const supported = notificationService.isSupported();
      setIsSupported(supported);

      if (supported) {
        const currentPermission = notificationService.getPermissionStatus();
        setPermission(currentPermission);

        const subscribed = await notificationService.isSubscribed();
        setIsSubscribed(subscribed);
      }
    };

    checkStatus();
  }, []);

  // Solicita permissão e inscreve para notificações
  const subscribe = useCallback(async () => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    if (!isSupported) {
      toast.error('Notificações não suportadas', {
        description: 'Seu navegador não suporta notificações push.',
      });
      return false;
    }

    setIsLoading(true);

    try {
      const subscription = await notificationService.subscribe(user.id);

      if (subscription) {
        setPermission('granted');
        setIsSubscribed(true);

        toast.success('Notificações ativadas', {
          description: 'Você receberá notificações sobre suas tarefas.',
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);

      if (error instanceof Error) {
        if (error.message.includes('permission denied')) {
          toast.error('Permissão negada', {
            description: 'Você precisa permitir notificações nas configurações do navegador.',
          });
        } else {
          toast.error('Erro ao ativar notificações', {
            description: error.message,
          });
        }
      }

      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupported]);

  // Cancela inscrição de notificações
  const unsubscribe = useCallback(async () => {
    if (!user) {
      return false;
    }

    setIsLoading(true);

    try {
      await notificationService.unsubscribe(user.id);
      setIsSubscribed(false);

      toast.success('Notificações desativadas', {
        description: 'Você não receberá mais notificações push.',
      });

      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from notifications:', error);

      toast.error('Erro ao desativar notificações', {
        description: 'Não foi possível desativar as notificações.',
      });

      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Mostra uma notificação local
  const showNotification = useCallback(
    async (title: string, options?: NotificationOptions) => {
      if (!isSupported) {
        console.warn('Notifications not supported');
        return;
      }

      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return;
      }

      await notificationService.showNotification(title, options);
    },
    [isSupported, permission]
  );

  // Solicita permissão (sem inscrever)
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      return 'denied' as NotificationPermission;
    }

    try {
      const newPermission = await notificationService.requestPermission();
      setPermission(newPermission);
      return newPermission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied' as NotificationPermission;
    }
  }, [isSupported]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    showNotification,
    requestPermission,
  };
}
