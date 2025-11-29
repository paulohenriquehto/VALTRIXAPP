import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Notification } from '../types';
import { notificationService } from '../services/notificationService';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface NotificationStore {
  // Estado
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  permissionStatus: NotificationPermission;

  // Realtime
  realtimeChannel: RealtimeChannel | null;

  // Actions
  fetchNotifications: (userId: string) => Promise<void>;
  checkProjectDeadlines: (userId: string) => Promise<number>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: (userId: string) => Promise<void>;

  // Local actions (para atualização otimista e realtime)
  addNotificationLocal: (notification: Notification) => void;
  updateNotificationLocal: (notification: Notification) => void;
  removeNotificationLocal: (notificationId: string) => void;

  // Realtime
  subscribeToUpdates: (userId: string) => void;
  unsubscribeFromUpdates: () => void;

  // Push Notifications
  requestPushPermission: () => Promise<NotificationPermission>;
  subscribeToPush: (userId: string) => Promise<void>;
  unsubscribeFromPush: (userId: string) => Promise<void>;
  checkPushSubscription: () => Promise<boolean>;
  updatePermissionStatus: () => void;

  // Reset
  reset: () => void;
}

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  permissionStatus: 'default' as NotificationPermission,
  realtimeChannel: null,
};

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Buscar notificações do servidor
      fetchNotifications: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          // Primeiro verifica prazos de projetos (pode criar novas notificações)
          await notificationService.checkProjectDeadlines(userId);

          // Depois busca todas as notificações
          const notifications = await notificationService.getNotifications(userId);
          const unreadCount = notifications.filter((n) => !n.read).length;
          set({ notifications, unreadCount, isLoading: false });
        } catch (error) {
          console.error('Erro ao buscar notificações:', error);
          set({ error: 'Falha ao carregar notificações', isLoading: false });
        }
      },

      // Verificar prazos de projetos e criar notificações
      checkProjectDeadlines: async (userId: string) => {
        try {
          const count = await notificationService.checkProjectDeadlines(userId);
          if (count > 0) {
            // Recarrega notificações se novas foram criadas
            const notifications = await notificationService.getNotifications(userId);
            const unreadCount = notifications.filter((n) => !n.read).length;
            set({ notifications, unreadCount });
          }
          return count;
        } catch (error) {
          console.error('Erro ao verificar prazos de projetos:', error);
          return 0;
        }
      },

      // Marcar como lida
      markAsRead: async (notificationId: string) => {
        // Atualização otimista
        const { notifications } = get();
        const updatedNotifications = notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        );
        const unreadCount = updatedNotifications.filter((n) => !n.read).length;
        set({ notifications: updatedNotifications, unreadCount });

        try {
          await notificationService.markAsRead(notificationId);
        } catch (error) {
          // Reverter em caso de erro
          set({ notifications, unreadCount: notifications.filter((n) => !n.read).length });
          console.error('Erro ao marcar como lida:', error);
        }
      },

      // Marcar todas como lidas
      markAllAsRead: async (userId: string) => {
        const { notifications } = get();
        // Atualização otimista
        const updatedNotifications = notifications.map((n) => ({ ...n, read: true }));
        set({ notifications: updatedNotifications, unreadCount: 0 });

        try {
          await notificationService.markAllAsRead(userId);
        } catch (error) {
          // Reverter em caso de erro
          set({ notifications, unreadCount: notifications.filter((n) => !n.read).length });
          console.error('Erro ao marcar todas como lidas:', error);
        }
      },

      // Deletar notificação
      deleteNotification: async (notificationId: string) => {
        const { notifications } = get();
        // Atualização otimista
        const updatedNotifications = notifications.filter((n) => n.id !== notificationId);
        const unreadCount = updatedNotifications.filter((n) => !n.read).length;
        set({ notifications: updatedNotifications, unreadCount });

        try {
          await notificationService.deleteNotification(notificationId);
        } catch (error) {
          // Reverter em caso de erro
          set({ notifications, unreadCount: notifications.filter((n) => !n.read).length });
          console.error('Erro ao deletar notificação:', error);
        }
      },

      // Limpar todas
      clearAll: async (userId: string) => {
        const { notifications } = get();
        set({ notifications: [], unreadCount: 0 });

        try {
          await notificationService.clearAllNotifications(userId);
        } catch (error) {
          // Reverter em caso de erro
          set({ notifications, unreadCount: notifications.filter((n) => !n.read).length });
          console.error('Erro ao limpar notificações:', error);
        }
      },

      // Ações locais para realtime
      addNotificationLocal: (notification: Notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + (notification.read ? 0 : 1),
        }));
      },

      updateNotificationLocal: (notification: Notification) => {
        set((state) => {
          const notifications = state.notifications.map((n) =>
            n.id === notification.id ? notification : n
          );
          return {
            notifications,
            unreadCount: notifications.filter((n) => !n.read).length,
          };
        });
      },

      removeNotificationLocal: (notificationId: string) => {
        set((state) => {
          const notifications = state.notifications.filter((n) => n.id !== notificationId);
          return {
            notifications,
            unreadCount: notifications.filter((n) => !n.read).length,
          };
        });
      },

      // Subscrever para atualizações em tempo real
      subscribeToUpdates: (userId: string) => {
        const { addNotificationLocal, updateNotificationLocal, removeNotificationLocal } = get();

        const channel = notificationService.subscribeToRealtime(
          userId,
          addNotificationLocal,
          updateNotificationLocal,
          removeNotificationLocal
        );

        set({ realtimeChannel: channel });
      },

      // Cancelar subscription
      unsubscribeFromUpdates: () => {
        notificationService.unsubscribeFromRealtime();
        set({ realtimeChannel: null });
      },

      // Solicitar permissão de push
      requestPushPermission: async () => {
        try {
          const permission = await notificationService.requestPermission();
          set({ permissionStatus: permission });
          return permission;
        } catch (error) {
          console.error('Erro ao solicitar permissão:', error);
          return 'denied';
        }
      },

      // Subscrever para push notifications
      subscribeToPush: async (userId: string) => {
        try {
          await notificationService.subscribe(userId);
          set({ permissionStatus: 'granted' });
        } catch (error) {
          console.error('Erro ao subscrever push:', error);
          throw error;
        }
      },

      // Cancelar push subscription
      unsubscribeFromPush: async (userId: string) => {
        try {
          await notificationService.unsubscribe(userId);
        } catch (error) {
          console.error('Erro ao cancelar push:', error);
          throw error;
        }
      },

      // Verificar se está subscrito
      checkPushSubscription: async () => {
        return notificationService.isSubscribed();
      },

      // Atualizar status de permissão
      updatePermissionStatus: () => {
        const status = notificationService.getPermissionStatus();
        set({ permissionStatus: status });
      },

      // Reset
      reset: () => {
        const { unsubscribeFromUpdates } = get();
        unsubscribeFromUpdates();
        set(initialState);
      },
    }),
    { name: 'notification-store' }
  )
);

// Hook para facilitar o uso
export const useNotifications = () => {
  const store = useNotificationStore();
  return {
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    isLoading: store.isLoading,
    error: store.error,
    permissionStatus: store.permissionStatus,
    fetchNotifications: store.fetchNotifications,
    checkProjectDeadlines: store.checkProjectDeadlines,
    markAsRead: store.markAsRead,
    markAllAsRead: store.markAllAsRead,
    deleteNotification: store.deleteNotification,
    clearAll: store.clearAll,
    subscribeToUpdates: store.subscribeToUpdates,
    unsubscribeFromUpdates: store.unsubscribeFromUpdates,
    requestPushPermission: store.requestPushPermission,
    subscribeToPush: store.subscribeToPush,
    unsubscribeFromPush: store.unsubscribeFromPush,
    checkPushSubscription: store.checkPushSubscription,
    updatePermissionStatus: store.updatePermissionStatus,
    reset: store.reset,
  };
};
