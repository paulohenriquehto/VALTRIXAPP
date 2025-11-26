/**
 * Notification Service
 *
 * Gerencia notificações push usando Web Push API e CRUD de notificações
 */

import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Notification } from '@/types';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Tipo para notificação do banco de dados
export interface DbNotification {
  id: string;
  user_id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'task_due' | 'task_overdue' | 'task_assigned' | 'task_completed';
  title: string;
  message: string;
  read: boolean;
  metadata: Record<string, any>;
  related_task_id: string | null;
  related_project_id: string | null;
  created_at: string;
  read_at: string | null;
}

// Converte notificação do banco para o tipo do app
function dbToAppNotification(db: DbNotification): Notification {
  return {
    id: db.id,
    type: db.type as Notification['type'],
    title: db.title,
    message: db.message,
    read: db.read,
    createdAt: db.created_at,
    metadata: {
      ...db.metadata,
      relatedTaskId: db.related_task_id,
      relatedProjectId: db.related_project_id,
      readAt: db.read_at,
    },
  };
}

class NotificationService {
  private vapidPublicKey: string | null = null;
  private realtimeChannel: RealtimeChannel | null = null;

  constructor() {
    this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || null;
  }

  // ==================== CRUD Methods ====================

  /**
   * Busca todas as notificações do usuário
   */
  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map(dbToAppNotification);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  }

  /**
   * Busca contagem de notificações não lidas
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      return 0;
    }
  }

  /**
   * Marca uma notificação como lida
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Marca todas as notificações do usuário como lidas
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Deleta uma notificação específica
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  /**
   * Limpa todas as notificações do usuário
   */
  async clearAllNotifications(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      throw error;
    }
  }

  /**
   * Inscreve para atualizações em tempo real
   */
  subscribeToRealtime(
    userId: string,
    onInsert: (notification: Notification) => void,
    onUpdate?: (notification: Notification) => void,
    onDelete?: (id: string) => void
  ): RealtimeChannel {
    // Remove canal anterior se existir
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
    }

    this.realtimeChannel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = dbToAppNotification(payload.new as DbNotification);
          onInsert(notification);

          // Mostra notificação do sistema se permitido
          if (this.getPermissionStatus() === 'granted') {
            this.showNotification(notification.title, {
              body: notification.message,
              tag: notification.id,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (onUpdate) {
            const notification = dbToAppNotification(payload.new as DbNotification);
            onUpdate(notification);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (onDelete) {
            onDelete((payload.old as { id: string }).id);
          }
        }
      )
      .subscribe();

    return this.realtimeChannel;
  }

  /**
   * Cancela inscrição do realtime
   */
  unsubscribeFromRealtime(): void {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }

  // ==================== Web Push Methods ====================

  /**
   * Verifica se o navegador suporta notificações
   */
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Obtém o status da permissão de notificação
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Solicita permissão para notificações
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Notifications not supported in this browser');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Inscreve o usuário para receber notificações push
   */
  async subscribe(userId: string): Promise<PushSubscriptionData | null> {
    if (!this.isSupported()) {
      throw new Error('Push notifications not supported');
    }

    if (!this.vapidPublicKey) {
      console.warn('VAPID public key not configured');
      return null;
    }

    // Solicita permissão se necessário
    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    try {
      // Obtém o service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Inscreve para push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as BufferSource,
      });

      // Converte a subscription para o formato JSON
      const subscriptionJSON = subscription.toJSON();

      if (!subscriptionJSON.endpoint || !subscriptionJSON.keys) {
        throw new Error('Invalid subscription format');
      }

      const subscriptionData: PushSubscriptionData = {
        endpoint: subscriptionJSON.endpoint,
        keys: {
          p256dh: subscriptionJSON.keys.p256dh!,
          auth: subscriptionJSON.keys.auth!,
        },
      };

      // Salva no Supabase
      await this.saveSubscription(userId, subscriptionData);

      return subscriptionData;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  /**
   * Cancela a inscrição de notificações push
   */
  async unsubscribe(userId: string): Promise<void> {
    if (!this.isSupported()) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove do Supabase
      await this.removeSubscription(userId);
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }

  /**
   * Verifica se o usuário está inscrito
   */
  async isSubscribed(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return false;
    }
  }

  /**
   * Envia uma notificação local (não push)
   */
  async showNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Notifications not supported');
      return;
    }

    const permission = this.getPermissionStatus();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-64x64.png',
        ...options,
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  /**
   * Salva a subscription no Supabase
   */
  private async saveSubscription(
    userId: string,
    subscription: PushSubscriptionData
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh_key: subscription.keys.p256dh,
          auth_key: subscription.keys.auth,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,endpoint'
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Failed to save subscription to database:', error);
      throw error;
    }
  }

  /**
   * Remove a subscription do Supabase
   */
  private async removeSubscription(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Failed to remove subscription from database:', error);
      throw error;
    }
  }

  /**
   * Converte VAPID key de base64 para Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

// Singleton instance
export const notificationService = new NotificationService();
