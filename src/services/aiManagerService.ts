import { supabase } from '../lib/supabase';
import type {
  AIMessage,
  AIInsight,
  AIStreamCallbacks,
  AIConversation,
  AIAction
} from '../types/ai';

class AIManagerService {
  private baseUrl = import.meta.env.VITE_SUPABASE_URL;

  /**
   * Envia mensagem para o AI Manager com streaming
   */
  async streamChat(
    messages: Pick<AIMessage, 'role' | 'content'>[],
    callbacks: AIStreamCallbacks
  ): Promise<void> {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        callbacks.onError(new Error('Não autenticado'));
        return;
      }

      const response = await fetch(`${this.baseUrl}/functions/v1/ai-manager`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages, stream: true }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        callbacks.onError(new Error(`Erro ${response.status}: ${errorText}`));
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        callbacks.onError(new Error('Reader não disponível'));
        return;
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'content' && data.content) {
              callbacks.onContent(data.content);
            }

            if (data.type === 'tool_result') {
              callbacks.onToolResult(data.tool, data.result);
            }

            if (data.type === 'done') {
              callbacks.onDone();
            }

            if (data.type === 'error') {
              callbacks.onError(new Error(data.error));
            }
          } catch {
            // Ignorar linhas mal formatadas
          }
        }
      }
    } catch (error) {
      callbacks.onError(error instanceof Error ? error : new Error('Erro desconhecido'));
    }
  }

  /**
   * Obtém o briefing diário mais recente
   */
  async getDailyBriefing(): Promise<AIInsight | null> {
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('type', 'daily_briefing')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar briefing diário:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      type: data.type as AIInsight['type'],
      priority: data.priority as AIInsight['priority'],
      content: data.content,
      contextSnapshot: data.context_snapshot,
      isRead: data.is_read,
      createdAt: data.created_at,
    };
  }

  /**
   * Obtém insights não lidos
   */
  async getUnreadInsights(): Promise<AIInsight[]> {
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar insights:', error);
      return [];
    }

    return (data || []).map((item) => ({
      id: item.id,
      type: item.type as AIInsight['type'],
      priority: item.priority as AIInsight['priority'],
      content: item.content,
      contextSnapshot: item.context_snapshot,
      isRead: item.is_read,
      createdAt: item.created_at,
    }));
  }

  /**
   * Marca um insight como lido
   */
  async markInsightAsRead(insightId: string): Promise<boolean> {
    const { error } = await supabase
      .from('ai_insights')
      .update({ is_read: true })
      .eq('id', insightId);

    if (error) {
      console.error('Erro ao marcar insight como lido:', error);
      return false;
    }

    return true;
  }

  /**
   * Marca todos os insights como lidos
   */
  async markAllInsightsAsRead(): Promise<boolean> {
    const { error } = await supabase
      .from('ai_insights')
      .update({ is_read: true })
      .eq('is_read', false);

    if (error) {
      console.error('Erro ao marcar todos os insights:', error);
      return false;
    }

    return true;
  }

  /**
   * Salva uma conversa no banco de dados
   */
  async saveConversation(
    userId: string,
    messages: AIMessage[],
    title?: string
  ): Promise<AIConversation | null> {
    // Criar conversa
    const { data: conversation, error: convError } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: userId,
        title: title || `Conversa ${new Date().toLocaleDateString('pt-BR')}`,
      })
      .select()
      .single();

    if (convError || !conversation) {
      console.error('Erro ao criar conversa:', convError);
      return null;
    }

    // Salvar mensagens
    const messagesToInsert = messages.map((msg) => ({
      conversation_id: conversation.id,
      role: msg.role,
      content: msg.content,
      tool_calls: msg.toolCalls ? JSON.stringify(msg.toolCalls) : null,
      tool_results: msg.toolResults ? JSON.stringify(msg.toolResults) : null,
    }));

    const { error: msgError } = await supabase
      .from('ai_messages')
      .insert(messagesToInsert);

    if (msgError) {
      console.error('Erro ao salvar mensagens:', msgError);
    }

    return {
      id: conversation.id,
      userId: conversation.user_id,
      title: conversation.title,
      messages,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
    };
  }

  /**
   * Lista todas as conversas do usuário
   */
  async getConversations(userId: string): Promise<AIConversation[]> {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar conversas:', error);
      return [];
    }

    return (data || []).map((conv) => ({
      id: conv.id,
      userId: conv.user_id,
      title: conv.title,
      messages: [],
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
    }));
  }

  /**
   * Carrega mensagens de uma conversa
   */
  async getConversationMessages(conversationId: string): Promise<AIMessage[]> {
    const { data, error } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar mensagens:', error);
      return [];
    }

    return (data || []).map((msg) => ({
      id: msg.id,
      role: msg.role as AIMessage['role'],
      content: msg.content,
      toolCalls: msg.tool_calls ? JSON.parse(msg.tool_calls) : undefined,
      toolResults: msg.tool_results ? JSON.parse(msg.tool_results) : undefined,
      timestamp: msg.created_at,
    }));
  }

  /**
   * Obtém o histórico de ações do AI
   */
  async getActionHistory(userId: string, limit = 50): Promise<AIAction[]> {
    const { data, error } = await supabase
      .from('ai_actions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar histórico de ações:', error);
      return [];
    }

    return (data || []).map((action) => ({
      id: action.id,
      userId: action.user_id,
      conversationId: action.conversation_id,
      actionType: action.action_type as AIAction['actionType'],
      params: action.params,
      result: action.result,
      status: action.status as AIAction['status'],
      rollbackData: action.rollback_data,
      errorMessage: action.error_message,
      executedAt: action.executed_at,
      createdAt: action.created_at,
    }));
  }

  /**
   * Deleta uma conversa
   */
  async deleteConversation(conversationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      console.error('Erro ao deletar conversa:', error);
      return false;
    }

    return true;
  }

  /**
   * Solicita análise proativa do AI (trigger manual)
   */
  async requestAnalysis(analysisType: 'daily_briefing' | 'proactive'): Promise<boolean> {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) return false;

      const response = await fetch(`${this.baseUrl}/functions/v1/scheduled-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ analysisType }),
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao solicitar análise:', error);
      return false;
    }
  }
}

export const aiManagerService = new AIManagerService();
