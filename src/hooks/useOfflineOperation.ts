import { useState, useEffect, useCallback } from 'react';
import { offlineQueue, type QueuedOperation } from '@/services/offlineQueueService';
import { toast } from 'sonner';

interface UseOfflineOperationOptions {
  entity: string;
  onExecute?: (operation: QueuedOperation) => Promise<void>;
  enableAutoSync?: boolean;
}

export function useOfflineOperation(options: UseOfflineOperationOptions) {
  const { entity, onExecute, enableAutoSync = true } = options;
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Atualiza contagem de operações pendentes
  const updatePendingCount = useCallback(() => {
    const queue = offlineQueue.getQueue();
    const entityQueue = queue.filter(op => op.entity === entity);
    setPendingCount(entityQueue.length);
  }, [entity]);

  // Executa operação ou enfileira se offline
  const executeOrQueue = useCallback(async <T>(
    type: QueuedOperation['type'],
    data: any,
    onlineOperation: () => Promise<T>
  ): Promise<T | null> => {
    if (navigator.onLine) {
      try {
        // Se online, tenta executar diretamente
        const result = await onlineOperation();
        return result;
      } catch (error) {
        console.error('Operation failed:', error);

        // Se falhou mesmo estando online, enfileira
        const operationId = offlineQueue.enqueue(type, entity, data);
        toast.warning('Operação enfileirada', {
          description: 'A operação será sincronizada automaticamente.',
        });

        updatePendingCount();
        return null;
      }
    } else {
      // Se offline, enfileira diretamente
      const operationId = offlineQueue.enqueue(type, entity, data);
      toast.info('Você está offline', {
        description: 'A operação será sincronizada quando voltar online.',
      });

      updatePendingCount();
      return null;
    }
  }, [entity, updatePendingCount]);

  // Sincroniza operações pendentes
  const sync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await offlineQueue.sync();

      if (result.success > 0) {
        toast.success('Sincronização concluída', {
          description: `${result.success} operação(ões) sincronizada(s).`,
        });
      }

      if (result.failed > 0) {
        toast.error('Algumas operações falharam', {
          description: `${result.failed} operação(ões) não puderam ser sincronizadas.`,
        });
      }

      updatePendingCount();
    } catch (error) {
      toast.error('Erro na sincronização', {
        description: 'Não foi possível sincronizar as operações.',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [updatePendingCount]);

  // Limpa fila de operações
  const clearQueue = useCallback(() => {
    offlineQueue.clear();
    updatePendingCount();
    toast.success('Fila limpa', {
      description: 'Todas as operações pendentes foram removidas.',
    });
  }, [updatePendingCount]);

  // Setup: listener para mudanças na fila
  useEffect(() => {
    updatePendingCount();

    const listener = () => {
      updatePendingCount();
      setIsSyncing(offlineQueue.isSyncInProgress());
    };

    offlineQueue.addListener(listener);

    return () => {
      offlineQueue.removeListener(listener);
    };
  }, [updatePendingCount]);

  // Setup: handler para executar operações
  useEffect(() => {
    if (!onExecute) return;

    const handleExecute = async (event: Event) => {
      const customEvent = event as CustomEvent<QueuedOperation>;
      const operation = customEvent.detail;

      // Só processa operações da entidade atual
      if (operation.entity !== entity) return;

      try {
        await onExecute(operation);
      } catch (error) {
        console.error('Failed to execute queued operation:', error);
        throw error;
      }
    };

    window.addEventListener('offline-queue-execute', handleExecute);

    return () => {
      window.removeEventListener('offline-queue-execute', handleExecute);
    };
  }, [entity, onExecute]);

  // Auto-sync quando voltar online
  useEffect(() => {
    if (!enableAutoSync) return;

    const handleOnline = () => {
      if (pendingCount > 0) {
        toast.info('Sincronizando operações...', {
          description: 'Aguarde enquanto sincronizamos suas alterações.',
        });
        sync();
      }
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [enableAutoSync, pendingCount, sync]);

  return {
    executeOrQueue,
    sync,
    clearQueue,
    pendingCount,
    isSyncing,
    isOnline: navigator.onLine,
  };
}
