/**
 * Offline Queue Service
 *
 * Gerencia uma fila de operações que falham devido à falta de conexão.
 * Quando a conexão é restaurada, tenta sincronizar automaticamente.
 */

export interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string; // 'task', 'project', 'category', etc.
  data: any;
  timestamp: number;
  retries: number;
  lastError?: string;
}

const STORAGE_KEY = 'valtrixapp-offline-queue';
const MAX_RETRIES = 3;

class OfflineQueueService {
  private queue: QueuedOperation[] = [];
  private isSyncing = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadQueue();
    this.setupOnlineListener();
  }

  /**
   * Carrega a fila do localStorage
   */
  private loadQueue() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
    }
  }

  /**
   * Salva a fila no localStorage
   */
  private saveQueue() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Configura listener para quando voltar online
   */
  private setupOnlineListener() {
    window.addEventListener('online', () => {
      console.log('Connection restored, syncing offline queue...');
      this.sync();
    });
  }

  /**
   * Adiciona operação à fila
   */
  enqueue(
    type: QueuedOperation['type'],
    entity: string,
    data: any
  ): string {
    const operation: QueuedOperation = {
      id: crypto.randomUUID(),
      type,
      entity,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(operation);
    this.saveQueue();

    console.log(`Queued ${type} operation for ${entity}:`, operation.id);

    return operation.id;
  }

  /**
   * Remove operação da fila
   */
  dequeue(id: string) {
    const index = this.queue.findIndex(op => op.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.saveQueue();
    }
  }

  /**
   * Obtém todas as operações na fila
   */
  getQueue(): QueuedOperation[] {
    return [...this.queue];
  }

  /**
   * Limpa toda a fila
   */
  clear() {
    this.queue = [];
    this.saveQueue();
  }

  /**
   * Sincroniza operações da fila
   */
  async sync(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing || this.queue.length === 0) {
      return { success: 0, failed: 0 };
    }

    if (!navigator.onLine) {
      console.log('Cannot sync: offline');
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    let successCount = 0;
    let failedCount = 0;

    // Cria uma cópia da fila para processar
    const operationsToProcess = [...this.queue];

    for (const operation of operationsToProcess) {
      try {
        // Tenta executar a operação
        await this.executeOperation(operation);

        // Se sucesso, remove da fila
        this.dequeue(operation.id);
        successCount++;

        console.log(`Successfully synced operation ${operation.id}`);
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);

        // Incrementa tentativas
        operation.retries++;
        operation.lastError = error instanceof Error ? error.message : 'Unknown error';

        // Se excedeu max tentativas, remove da fila
        if (operation.retries >= MAX_RETRIES) {
          console.error(`Max retries exceeded for operation ${operation.id}, removing from queue`);
          this.dequeue(operation.id);
          failedCount++;
        } else {
          // Atualiza a operação na fila
          const index = this.queue.findIndex(op => op.id === operation.id);
          if (index !== -1) {
            this.queue[index] = operation;
          }
          failedCount++;
        }
      }
    }

    this.saveQueue();
    this.isSyncing = false;

    console.log(`Sync completed: ${successCount} succeeded, ${failedCount} failed`);

    return { success: successCount, failed: failedCount };
  }

  /**
   * Executa uma operação específica
   * Este método deve ser sobrescrito ou configurado com handlers customizados
   */
  private async executeOperation(operation: QueuedOperation): Promise<void> {
    // Dispara evento customizado para que a aplicação possa lidar com a operação
    const event = new CustomEvent('offline-queue-execute', {
      detail: operation,
    });

    window.dispatchEvent(event);

    // Aguarda um pequeno tempo para garantir que o evento foi processado
    await new Promise(resolve => setTimeout(resolve, 100));

    // Se nenhum handler customizado foi configurado, lança erro
    if (!this.hasCustomHandler(operation.entity)) {
      throw new Error(`No handler configured for entity: ${operation.entity}`);
    }
  }

  /**
   * Verifica se existe handler customizado para uma entidade
   */
  private hasCustomHandler(entity: string): boolean {
    // Verifica se existe listener para o evento customizado
    return true; // Por padrão, assume que existe
  }

  /**
   * Adiciona listener para mudanças na fila
   */
  addListener(listener: () => void) {
    this.listeners.add(listener);
  }

  /**
   * Remove listener
   */
  removeListener(listener: () => void) {
    this.listeners.delete(listener);
  }

  /**
   * Notifica todos os listeners
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Retorna o status da sincronização
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Retorna o número de operações pendentes
   */
  getPendingCount(): number {
    return this.queue.length;
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueueService();
