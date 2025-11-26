// Tipos do AI Manager

// Mensagem do chat com AI
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: AIToolCall[];
  toolResults?: AIToolResult[];
  timestamp: string;
}

// Chamada de ferramenta pelo AI
export interface AIToolCall {
  id: string;
  tool: string;
  params: Record<string, unknown>;
}

// Resultado de execução de ferramenta
export interface AIToolResult {
  toolCallId: string;
  tool: string;
  success: boolean;
  result?: unknown;
  error?: string;
}

// Insight gerado pelo AI
export interface AIInsight {
  id: string;
  type: AIInsightType;
  priority: AIInsightPriority;
  content: string;
  contextSnapshot?: AIContextSnapshot;
  isRead: boolean;
  createdAt: string;
}

// Tipos de insight
export type AIInsightType = 'daily_briefing' | 'alert' | 'opportunity' | 'trend';

// Prioridade de insight
export type AIInsightPriority = 'high' | 'medium' | 'low';

// Conversa com AI
export interface AIConversation {
  id: string;
  userId: string;
  title?: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

// Ação executada pelo AI
export interface AIAction {
  id: string;
  userId: string;
  conversationId?: string;
  actionType: AIActionType;
  params: Record<string, unknown>;
  result?: Record<string, unknown>;
  status: AIActionStatus;
  rollbackData?: Record<string, unknown>;
  errorMessage?: string;
  executedAt?: string;
  createdAt: string;
}

// Tipos de ações que o AI pode executar
export type AIActionType =
  | 'create_task'
  | 'update_task'
  | 'delete_task'
  | 'update_task_priority'
  | 'create_notification'
  | 'analyze_metrics';

// Status de execução de ação
export type AIActionStatus = 'pending' | 'executed' | 'failed' | 'rolled_back';

// Contexto agregado para o AI
export interface AIContextSnapshot {
  timestamp: string;
  financial: AIFinancialContext;
  tasks: AITasksContext;
  projects: AIProjectsContext;
  alerts: AIAlertsContext;
}

// Contexto financeiro
export interface AIFinancialContext {
  mrr: number;
  arr: number;
  activeClients: number;
  paymentsOverdue: number;
  overdueAmount: number;
  todayRevenue: number;
}

// Contexto de tarefas
export interface AITasksContext {
  total: number;
  overdue: number;
  atRisk: number;
  completionRate: number;
  overdueList: AITaskItem[];
}

// Item de tarefa simplificado
export interface AITaskItem {
  id: string;
  title: string;
  dueDate?: string;
  priority?: string;
}

// Contexto de projetos
export interface AIProjectsContext {
  active: number;
  delayed: number;
}

// Contexto de alertas
export interface AIAlertsContext {
  overduePayments: AIPaymentAlert[];
  overdueTasks: AITaskAlert[];
}

// Alerta de pagamento
export interface AIPaymentAlert {
  name: string;
  amount: number;
}

// Alerta de tarefa
export interface AITaskAlert {
  title: string;
  priority: string;
}

// Callbacks para streaming do chat
export interface AIStreamCallbacks {
  onContent: (content: string) => void;
  onToolResult: (tool: string, result: unknown) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

// Resposta do stream SSE
export interface AIStreamEvent {
  type: 'content' | 'tool_result' | 'done' | 'error';
  content?: string;
  tool?: string;
  result?: unknown;
  error?: string;
}

// Configurações do AI Manager
export interface AIManagerConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  streamingEnabled: boolean;
}

// Constantes
export const AI_MODELS = {
  LLAMA_70B: 'llama-3.3-70b-versatile',
  LLAMA_8B: 'llama-3.1-8b-instant',
} as const;

export const AI_INSIGHT_TYPES = {
  DAILY_BRIEFING: 'daily_briefing',
  ALERT: 'alert',
  OPPORTUNITY: 'opportunity',
  TREND: 'trend',
} as const;

export const AI_ACTION_STATUSES = {
  PENDING: 'pending',
  EXECUTED: 'executed',
  FAILED: 'failed',
  ROLLED_BACK: 'rolled_back',
} as const;
