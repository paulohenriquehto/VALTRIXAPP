// Tool definitions for Groq function calling - ValtrixApp AI Manager

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required: string[];
    };
  };
}

export const AI_TOOLS: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Cria uma nova tarefa no sistema. Use quando o usuário pedir para criar uma tarefa ou quando identificar que uma tarefa precisa ser criada.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Título da tarefa (claro e objetivo)',
          },
          description: {
            type: 'string',
            description: 'Descrição detalhada da tarefa',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent'],
            description: 'Prioridade da tarefa',
          },
          due_date: {
            type: 'string',
            description: 'Data de vencimento no formato ISO (YYYY-MM-DD)',
          },
          project_id: {
            type: 'string',
            description: 'ID do projeto associado (opcional)',
          },
          client_id: {
            type: 'string',
            description: 'ID do cliente associado (opcional)',
          },
          assigned_to: {
            type: 'string',
            description: 'ID do usuário responsável (opcional)',
          },
          estimated_hours: {
            type: 'number',
            description: 'Estimativa de horas para completar',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Tags para categorização',
          },
        },
        required: ['title', 'priority'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_task_priority',
      description: 'Atualiza a prioridade de uma ou mais tarefas existentes. Use quando identificar que tarefas precisam ser repriorizadas.',
      parameters: {
        type: 'object',
        properties: {
          task_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs das tarefas a serem atualizadas',
          },
          new_priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent'],
            description: 'Nova prioridade',
          },
          reason: {
            type: 'string',
            description: 'Justificativa para a mudança',
          },
        },
        required: ['task_ids', 'new_priority', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_notification',
      description: 'Cria uma notificação para o usuário. Use para alertas importantes, lembretes ou insights.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Título da notificação',
          },
          message: {
            type: 'string',
            description: 'Conteúdo da notificação',
          },
          type: {
            type: 'string',
            enum: ['task_reminder', 'deadline', 'mention', 'system', 'ai_insight'],
            description: 'Tipo da notificação',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: 'Prioridade da notificação',
          },
          action_url: {
            type: 'string',
            description: 'URL para ação relacionada (opcional)',
          },
          related_task_id: {
            type: 'string',
            description: 'ID da tarefa relacionada (opcional)',
          },
        },
        required: ['title', 'message', 'type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_metrics',
      description: 'Analisa métricas específicas do sistema. Use quando o usuário perguntar sobre performance, receita, produtividade ou qualquer métrica.',
      parameters: {
        type: 'object',
        properties: {
          metric_type: {
            type: 'string',
            enum: ['mrr', 'tasks_completed', 'productivity', 'client_growth', 'overdue_tasks', 'revenue_concentration'],
            description: 'Tipo de métrica a analisar',
          },
          period: {
            type: 'string',
            enum: ['today', 'this_week', 'this_month', 'last_30_days', 'this_quarter', 'this_year'],
            description: 'Período da análise',
          },
          compare_with_previous: {
            type: 'boolean',
            description: 'Se deve comparar com período anterior',
          },
        },
        required: ['metric_type', 'period'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_insight',
      description: 'Cria um insight proativo no sistema para ser exibido ao usuário.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Título do insight',
          },
          content: {
            type: 'string',
            description: 'Conteúdo detalhado do insight',
          },
          insight_type: {
            type: 'string',
            enum: ['opportunity', 'warning', 'recommendation', 'achievement'],
            description: 'Tipo do insight',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: 'Prioridade do insight',
          },
          suggested_action: {
            type: 'string',
            description: 'Ação sugerida para o usuário',
          },
          metric_impact: {
            type: 'string',
            description: 'Impacto estimado (ex: "+15% MRR")',
          },
        },
        required: ['title', 'content', 'insight_type', 'priority'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_tasks_summary',
      description: 'Obtém um resumo das tarefas do usuário. Use para responder perguntas sobre tarefas pendentes, atrasadas ou concluídas.',
      parameters: {
        type: 'object',
        properties: {
          status_filter: {
            type: 'string',
            enum: ['all', 'pending', 'in_progress', 'completed', 'overdue'],
            description: 'Filtro por status',
          },
          priority_filter: {
            type: 'string',
            enum: ['all', 'urgent', 'high', 'medium', 'low'],
            description: 'Filtro por prioridade',
          },
          limit: {
            type: 'number',
            description: 'Número máximo de tarefas a retornar',
          },
        },
        required: ['status_filter'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_clients_summary',
      description: 'Obtém um resumo dos clientes. Use para responder perguntas sobre clientes, MRR por cliente, ou análise de carteira.',
      parameters: {
        type: 'object',
        properties: {
          sort_by: {
            type: 'string',
            enum: ['mrr', 'name', 'created_at', 'tasks_count'],
            description: 'Campo para ordenação',
          },
          limit: {
            type: 'number',
            description: 'Número máximo de clientes a retornar',
          },
          include_mrr: {
            type: 'boolean',
            description: 'Se deve incluir cálculo de MRR',
          },
        },
        required: ['sort_by'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'schedule_reminder',
      description: 'Agenda um lembrete para o futuro.',
      parameters: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Mensagem do lembrete',
          },
          remind_at: {
            type: 'string',
            description: 'Data e hora do lembrete no formato ISO',
          },
          related_task_id: {
            type: 'string',
            description: 'ID da tarefa relacionada (opcional)',
          },
          related_client_id: {
            type: 'string',
            description: 'ID do cliente relacionado (opcional)',
          },
        },
        required: ['message', 'remind_at'],
      },
    },
  },
];

export type ToolName =
  | 'create_task'
  | 'update_task_priority'
  | 'create_notification'
  | 'analyze_metrics'
  | 'create_insight'
  | 'get_tasks_summary'
  | 'get_clients_summary'
  | 'schedule_reminder';

export interface ToolCallResult {
  success: boolean;
  data?: unknown;
  error?: string;
}
