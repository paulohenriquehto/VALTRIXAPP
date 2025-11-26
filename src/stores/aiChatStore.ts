import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AIMessage, AIInsight, AIConversation } from '../types/ai';
import { aiManagerService } from '../services/aiManagerService';

interface AIChatStore {
  // Estado do Chat
  messages: AIMessage[];
  isLoading: boolean;
  isOpen: boolean;
  error: string | null;
  streamingContent: string;

  // Insights
  dailyBriefing: AIInsight | null;
  unreadInsights: number;
  insights: AIInsight[];

  // Conversas
  conversations: AIConversation[];
  currentConversationId: string | null;

  // Actions do Chat
  sendMessage: (content: string) => Promise<void>;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  clearMessages: () => void;
  clearError: () => void;

  // Actions de Insights
  loadDailyBriefing: () => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  loadInsights: () => Promise<void>;
  markInsightAsRead: (insightId: string) => Promise<void>;

  // Actions de Conversas
  loadConversations: (userId: string) => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  saveCurrentConversation: (userId: string, title?: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  startNewConversation: () => void;

  // Reset
  reset: () => void;
}

const initialState = {
  messages: [],
  isLoading: false,
  isOpen: false,
  error: null,
  streamingContent: '',
  dailyBriefing: null,
  unreadInsights: 0,
  insights: [],
  conversations: [],
  currentConversationId: null,
};

// Mensagem de boas-vindas do AI
const welcomeMessage: AIMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `Olá! Eu sou o **Valtrix AI**, seu gerente virtual.

Posso ajudá-lo com:
- **Análise de Negócio**: MRR, fluxo de caixa, clientes em risco
- **Gestão de Tarefas**: Criar, priorizar, organizar
- **Alertas Proativos**: Pagamentos vencidos, prazos críticos
- **Insights**: Oportunidades de crescimento, otimização

Como posso ajudar você hoje?`,
  timestamp: new Date().toISOString(),
};

export const useAIChatStore = create<AIChatStore>()(
  devtools(
    (set, get) => ({
      ...initialState,
      messages: [welcomeMessage],

      // Enviar mensagem com streaming
      sendMessage: async (content: string) => {
        const userMessage: AIMessage = {
          id: crypto.randomUUID(),
          role: 'user',
          content,
          timestamp: new Date().toISOString(),
        };

        // Adicionar mensagem do usuário e iniciar loading
        set((state) => ({
          messages: [...state.messages, userMessage],
          isLoading: true,
          error: null,
          streamingContent: '',
        }));

        const aiMessageId = crypto.randomUUID();

        // Preparar mensagens para enviar (sem a welcome message)
        const messagesToSend = get()
          .messages.filter((m) => m.id !== 'welcome')
          .map((m) => ({ role: m.role, content: m.content }));

        await aiManagerService.streamChat(messagesToSend, {
          onContent: (chunk) => {
            set((state) => ({
              streamingContent: state.streamingContent + chunk,
            }));
          },

          onToolResult: (tool, result) => {
            console.log(`[AI] Tool ${tool} executado:`, result);
            // Podemos adicionar feedback visual de ações executadas
          },

          onDone: () => {
            const { streamingContent } = get();

            const aiMessage: AIMessage = {
              id: aiMessageId,
              role: 'assistant',
              content: streamingContent,
              timestamp: new Date().toISOString(),
            };

            set((state) => ({
              messages: [...state.messages, aiMessage],
              isLoading: false,
              streamingContent: '',
            }));
          },

          onError: (error) => {
            set({
              error: error.message || 'Erro ao comunicar com o AI',
              isLoading: false,
              streamingContent: '',
            });
          },
        });
      },

      // Toggle abertura do chat
      toggleOpen: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      // Setar estado de abertura
      setOpen: (open: boolean) => {
        set({ isOpen: open });
      },

      // Limpar mensagens (nova conversa)
      clearMessages: () => {
        set({
          messages: [welcomeMessage],
          currentConversationId: null,
          error: null,
        });
      },

      // Limpar erro
      clearError: () => {
        set({ error: null });
      },

      // Carregar briefing diário
      loadDailyBriefing: async () => {
        try {
          const briefing = await aiManagerService.getDailyBriefing();
          set({ dailyBriefing: briefing });
        } catch (error) {
          console.error('Erro ao carregar briefing:', error);
        }
      },

      // Carregar contagem de insights não lidos
      loadUnreadCount: async () => {
        try {
          const insights = await aiManagerService.getUnreadInsights();
          set({ unreadInsights: insights.length });
        } catch (error) {
          console.error('Erro ao carregar contagem:', error);
        }
      },

      // Carregar todos os insights
      loadInsights: async () => {
        try {
          const insights = await aiManagerService.getUnreadInsights();
          set({ insights, unreadInsights: insights.length });
        } catch (error) {
          console.error('Erro ao carregar insights:', error);
        }
      },

      // Marcar insight como lido
      markInsightAsRead: async (insightId: string) => {
        // Atualização otimista
        set((state) => ({
          insights: state.insights.map((i) =>
            i.id === insightId ? { ...i, isRead: true } : i
          ),
          unreadInsights: Math.max(0, state.unreadInsights - 1),
        }));

        try {
          await aiManagerService.markInsightAsRead(insightId);
        } catch (error) {
          console.error('Erro ao marcar insight:', error);
          // Reverter se necessário
          get().loadInsights();
        }
      },

      // Carregar conversas
      loadConversations: async (userId: string) => {
        try {
          const conversations = await aiManagerService.getConversations(userId);
          set({ conversations });
        } catch (error) {
          console.error('Erro ao carregar conversas:', error);
        }
      },

      // Carregar uma conversa específica
      loadConversation: async (conversationId: string) => {
        try {
          const messages = await aiManagerService.getConversationMessages(conversationId);
          set({
            messages: messages.length > 0 ? messages : [welcomeMessage],
            currentConversationId: conversationId,
          });
        } catch (error) {
          console.error('Erro ao carregar conversa:', error);
        }
      },

      // Salvar conversa atual
      saveCurrentConversation: async (userId: string, title?: string) => {
        const { messages, currentConversationId } = get();

        // Filtrar mensagem de welcome
        const messagesToSave = messages.filter((m) => m.id !== 'welcome');

        if (messagesToSave.length === 0) return;

        try {
          const conversation = await aiManagerService.saveConversation(
            userId,
            messagesToSave,
            title
          );

          if (conversation) {
            set((state) => ({
              conversations: [conversation, ...state.conversations.filter((c) => c.id !== currentConversationId)],
              currentConversationId: conversation.id,
            }));
          }
        } catch (error) {
          console.error('Erro ao salvar conversa:', error);
        }
      },

      // Deletar conversa
      deleteConversation: async (conversationId: string) => {
        // Atualização otimista
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== conversationId),
          currentConversationId:
            state.currentConversationId === conversationId ? null : state.currentConversationId,
          messages: state.currentConversationId === conversationId ? [welcomeMessage] : state.messages,
        }));

        try {
          await aiManagerService.deleteConversation(conversationId);
        } catch (error) {
          console.error('Erro ao deletar conversa:', error);
        }
      },

      // Iniciar nova conversa
      startNewConversation: () => {
        set({
          messages: [welcomeMessage],
          currentConversationId: null,
          error: null,
        });
      },

      // Reset completo
      reset: () => {
        set({ ...initialState, messages: [welcomeMessage] });
      },
    }),
    { name: 'ai-chat-store' }
  )
);

// Hook para facilitar o uso
export const useAIChat = () => {
  const store = useAIChatStore();
  return {
    // Chat state
    messages: store.messages,
    isLoading: store.isLoading,
    isOpen: store.isOpen,
    error: store.error,
    streamingContent: store.streamingContent,

    // Insights state
    dailyBriefing: store.dailyBriefing,
    unreadInsights: store.unreadInsights,
    insights: store.insights,

    // Conversations state
    conversations: store.conversations,
    currentConversationId: store.currentConversationId,

    // Chat actions
    sendMessage: store.sendMessage,
    toggleOpen: store.toggleOpen,
    setOpen: store.setOpen,
    clearMessages: store.clearMessages,
    clearError: store.clearError,

    // Insight actions
    loadDailyBriefing: store.loadDailyBriefing,
    loadUnreadCount: store.loadUnreadCount,
    loadInsights: store.loadInsights,
    markInsightAsRead: store.markInsightAsRead,

    // Conversation actions
    loadConversations: store.loadConversations,
    loadConversation: store.loadConversation,
    saveCurrentConversation: store.saveCurrentConversation,
    deleteConversation: store.deleteConversation,
    startNewConversation: store.startNewConversation,

    // Reset
    reset: store.reset,
  };
};
