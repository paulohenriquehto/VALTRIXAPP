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

  // ========== FERRAMENTAS DE PROJETOS ==========
  {
    type: 'function',
    function: {
      name: 'create_project',
      description: 'Cria um novo projeto no sistema. Use quando o usuário pedir para criar um projeto ou quando identificar que um projeto precisa ser criado.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Nome do projeto',
          },
          description: {
            type: 'string',
            description: 'Descrição detalhada do projeto',
          },
          client_id: {
            type: 'string',
            description: 'ID do cliente associado ao projeto',
          },
          start_date: {
            type: 'string',
            description: 'Data de início no formato ISO (YYYY-MM-DD)',
          },
          end_date: {
            type: 'string',
            description: 'Data de término prevista no formato ISO (YYYY-MM-DD)',
          },
          budget: {
            type: 'number',
            description: 'Orçamento do projeto em reais',
          },
          status: {
            type: 'string',
            enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
            description: 'Status inicial do projeto',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: 'Prioridade do projeto',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_project',
      description: 'Atualiza um projeto existente. Use para modificar status, datas, orçamento ou outras informações do projeto.',
      parameters: {
        type: 'object',
        properties: {
          project_id: {
            type: 'string',
            description: 'ID do projeto a ser atualizado',
          },
          name: {
            type: 'string',
            description: 'Novo nome do projeto',
          },
          description: {
            type: 'string',
            description: 'Nova descrição',
          },
          status: {
            type: 'string',
            enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
            description: 'Novo status',
          },
          end_date: {
            type: 'string',
            description: 'Nova data de término',
          },
          budget: {
            type: 'number',
            description: 'Novo orçamento',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: 'Nova prioridade',
          },
        },
        required: ['project_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_projects_summary',
      description: 'Obtém um resumo de todos os projetos. Use para listar projetos, filtrar por status ou cliente, ou obter visão geral.',
      parameters: {
        type: 'object',
        properties: {
          status_filter: {
            type: 'string',
            enum: ['all', 'planning', 'active', 'on_hold', 'completed', 'cancelled'],
            description: 'Filtro por status',
          },
          client_id: {
            type: 'string',
            description: 'Filtrar por cliente específico',
          },
          sort_by: {
            type: 'string',
            enum: ['name', 'created_at', 'end_date', 'budget', 'status'],
            description: 'Campo para ordenação',
          },
          limit: {
            type: 'number',
            description: 'Número máximo de projetos a retornar',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_project_details',
      description: 'Obtém detalhes completos de um projeto específico, incluindo tarefas, notas e documentos.',
      parameters: {
        type: 'object',
        properties: {
          project_id: {
            type: 'string',
            description: 'ID do projeto',
          },
          include_tasks: {
            type: 'boolean',
            description: 'Incluir lista de tarefas do projeto',
          },
          include_notes: {
            type: 'boolean',
            description: 'Incluir notas do projeto',
          },
          include_documents: {
            type: 'boolean',
            description: 'Incluir documentos anexados',
          },
        },
        required: ['project_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_project_note',
      description: 'Adiciona uma nota a um projeto existente.',
      parameters: {
        type: 'object',
        properties: {
          project_id: {
            type: 'string',
            description: 'ID do projeto',
          },
          content: {
            type: 'string',
            description: 'Conteúdo da nota',
          },
          note_type: {
            type: 'string',
            enum: ['general', 'update', 'issue', 'decision', 'milestone'],
            description: 'Tipo da nota',
          },
        },
        required: ['project_id', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_project_tasks',
      description: 'Obtém todas as tarefas de um projeto específico com filtros.',
      parameters: {
        type: 'object',
        properties: {
          project_id: {
            type: 'string',
            description: 'ID do projeto',
          },
          status_filter: {
            type: 'string',
            enum: ['all', 'pending', 'in_progress', 'completed'],
            description: 'Filtro por status da tarefa',
          },
          include_subtasks: {
            type: 'boolean',
            description: 'Incluir subtarefas',
          },
        },
        required: ['project_id'],
      },
    },
  },

  // ========== FERRAMENTAS DE CALENDÁRIO ==========
  {
    type: 'function',
    function: {
      name: 'get_upcoming_deadlines',
      description: 'Obtém prazos próximos de tarefas, projetos e pagamentos.',
      parameters: {
        type: 'object',
        properties: {
          days_ahead: {
            type: 'number',
            description: 'Número de dias à frente para buscar (padrão: 7)',
          },
          types: {
            type: 'array',
            items: { type: 'string', enum: ['task', 'project', 'payment'] },
            description: 'Tipos de prazos a incluir',
          },
          priority_filter: {
            type: 'string',
            enum: ['all', 'high', 'urgent'],
            description: 'Filtrar por prioridade',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_daily_schedule',
      description: 'Obtém a agenda completa de um dia específico.',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'Data no formato ISO (YYYY-MM-DD). Se não informada, usa hoje.',
          },
          include_tasks: {
            type: 'boolean',
            description: 'Incluir tarefas com vencimento no dia',
          },
          include_meetings: {
            type: 'boolean',
            description: 'Incluir reuniões/eventos',
          },
          include_payments: {
            type: 'boolean',
            description: 'Incluir pagamentos a receber',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_workload',
      description: 'Analisa a carga de trabalho do usuário ou equipe em um período.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['this_week', 'next_week', 'this_month', 'next_month'],
            description: 'Período para análise',
          },
          group_by: {
            type: 'string',
            enum: ['day', 'week', 'member', 'project'],
            description: 'Como agrupar a análise',
          },
          team_member_id: {
            type: 'string',
            description: 'ID de membro específico para análise individual',
          },
        },
        required: ['period'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_events_by_period',
      description: 'Obtém todos os eventos de calendário em um período específico.',
      parameters: {
        type: 'object',
        properties: {
          start_date: {
            type: 'string',
            description: 'Data de início no formato ISO',
          },
          end_date: {
            type: 'string',
            description: 'Data de fim no formato ISO',
          },
          event_types: {
            type: 'array',
            items: { type: 'string', enum: ['meeting', 'deadline', 'reminder', 'milestone'] },
            description: 'Tipos de eventos a incluir',
          },
        },
        required: ['start_date', 'end_date'],
      },
    },
  },

  // ========== FERRAMENTAS DE EQUIPE ==========
  {
    type: 'function',
    function: {
      name: 'get_team_summary',
      description: 'Obtém resumo completo da equipe: membros, departamentos, cargos e métricas.',
      parameters: {
        type: 'object',
        properties: {
          include_salaries: {
            type: 'boolean',
            description: 'Incluir informações de salário (requer permissão)',
          },
          department_filter: {
            type: 'string',
            description: 'Filtrar por departamento específico',
          },
          status_filter: {
            type: 'string',
            enum: ['all', 'active', 'inactive', 'on_leave'],
            description: 'Filtrar por status do membro',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_team_member_details',
      description: 'Obtém detalhes completos de um membro da equipe específico.',
      parameters: {
        type: 'object',
        properties: {
          member_id: {
            type: 'string',
            description: 'ID do membro da equipe',
          },
          include_tasks: {
            type: 'boolean',
            description: 'Incluir tarefas atribuídas ao membro',
          },
          include_projects: {
            type: 'boolean',
            description: 'Incluir projetos em que participa',
          },
          include_salary: {
            type: 'boolean',
            description: 'Incluir informações salariais',
          },
          include_performance: {
            type: 'boolean',
            description: 'Incluir métricas de performance',
          },
        },
        required: ['member_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_team_hierarchy',
      description: 'Obtém o organograma da equipe com hierarquia de gestores.',
      parameters: {
        type: 'object',
        properties: {
          department: {
            type: 'string',
            description: 'Filtrar por departamento (opcional)',
          },
          include_vacant_positions: {
            type: 'boolean',
            description: 'Incluir posições em aberto',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_department_summary',
      description: 'Obtém resumo de um departamento específico: membros, orçamento, projetos.',
      parameters: {
        type: 'object',
        properties: {
          department: {
            type: 'string',
            description: 'Nome do departamento',
          },
          include_budget: {
            type: 'boolean',
            description: 'Incluir informações de orçamento',
          },
          include_projects: {
            type: 'boolean',
            description: 'Incluir projetos do departamento',
          },
        },
        required: ['department'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_team_productivity',
      description: 'Analisa a produtividade da equipe ou de membros específicos.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['this_week', 'this_month', 'last_month', 'this_quarter'],
            description: 'Período para análise',
          },
          group_by: {
            type: 'string',
            enum: ['member', 'department', 'project'],
            description: 'Como agrupar a análise',
          },
          member_id: {
            type: 'string',
            description: 'Analisar membro específico',
          },
          metrics: {
            type: 'array',
            items: { type: 'string', enum: ['tasks_completed', 'hours_worked', 'on_time_rate', 'quality_score'] },
            description: 'Métricas a incluir na análise',
          },
        },
        required: ['period'],
      },
    },
  },

  // ========== FERRAMENTAS DE PAGAMENTOS ==========
  {
    type: 'function',
    function: {
      name: 'get_payments_summary',
      description: 'Obtém resumo financeiro completo: recebidos, pendentes, atrasados, projeções.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['this_month', 'last_month', 'this_quarter', 'this_year'],
            description: 'Período para o resumo',
          },
          client_id: {
            type: 'string',
            description: 'Filtrar por cliente específico',
          },
          include_forecast: {
            type: 'boolean',
            description: 'Incluir projeção para próximo período',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_pending_payments',
      description: 'Lista todos os pagamentos pendentes e atrasados com detalhes.',
      parameters: {
        type: 'object',
        properties: {
          status_filter: {
            type: 'string',
            enum: ['all', 'pending', 'overdue'],
            description: 'Filtro por status do pagamento',
          },
          client_id: {
            type: 'string',
            description: 'Filtrar por cliente',
          },
          sort_by: {
            type: 'string',
            enum: ['due_date', 'amount', 'client_name', 'days_overdue'],
            description: 'Campo para ordenação',
          },
          limit: {
            type: 'number',
            description: 'Número máximo de registros',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'record_payment',
      description: 'Registra o recebimento de um pagamento.',
      parameters: {
        type: 'object',
        properties: {
          payment_id: {
            type: 'string',
            description: 'ID do pagamento a ser registrado',
          },
          paid_date: {
            type: 'string',
            description: 'Data do recebimento no formato ISO',
          },
          amount_paid: {
            type: 'number',
            description: 'Valor efetivamente recebido (se diferente do esperado)',
          },
          payment_method: {
            type: 'string',
            enum: ['pix', 'bank_transfer', 'credit_card', 'boleto', 'cash', 'other'],
            description: 'Método de pagamento usado',
          },
          notes: {
            type: 'string',
            description: 'Observações sobre o pagamento',
          },
        },
        required: ['payment_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_revenue_forecast',
      description: 'Gera projeção de receita baseada em contratos e histórico.',
      parameters: {
        type: 'object',
        properties: {
          months_ahead: {
            type: 'number',
            description: 'Quantos meses projetar (máximo 12)',
          },
          include_mrr: {
            type: 'boolean',
            description: 'Incluir MRR recorrente na projeção',
          },
          include_projects: {
            type: 'boolean',
            description: 'Incluir receita de projetos',
          },
          scenario: {
            type: 'string',
            enum: ['conservative', 'moderate', 'optimistic'],
            description: 'Cenário de projeção',
          },
        },
        required: ['months_ahead'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_payment_health',
      description: 'Analisa a saúde das cobranças: inadimplência, tempo médio de recebimento, etc.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['this_month', 'last_3_months', 'last_6_months', 'this_year'],
            description: 'Período para análise',
          },
          client_id: {
            type: 'string',
            description: 'Analisar cliente específico',
          },
          metrics: {
            type: 'array',
            items: { type: 'string', enum: ['default_rate', 'avg_days_to_pay', 'collection_efficiency', 'churn_risk'] },
            description: 'Métricas a calcular',
          },
        },
        required: ['period'],
      },
    },
  },

  // ========== FERRAMENTAS DE METAS ==========
  {
    type: 'function',
    function: {
      name: 'get_current_goals',
      description: 'Obtém as metas do mês atual e o progresso de cada métrica (MRR, Clientes, Tarefas, Projetos). Use para informar ao usuário sobre seu progresso em relação às metas.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_goal',
      description: 'Define ou atualiza uma meta específica para o mês atual. Use quando o usuário quiser definir ou modificar suas metas mensais.',
      parameters: {
        type: 'object',
        properties: {
          metric: {
            type: 'string',
            enum: ['mrr', 'clients', 'tasks', 'projects'],
            description: 'A métrica para definir a meta',
          },
          target: {
            type: 'number',
            description: 'O valor alvo da meta',
          },
          confirm: {
            type: 'boolean',
            description: 'Se true, confirma as metas para começar o acompanhamento',
          },
        },
        required: ['metric', 'target'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'suggest_goals',
      description: 'Gera sugestões de metas baseadas no histórico do usuário com 10% de crescimento. Use quando o usuário quiser receber sugestões automáticas de metas.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_goal_insights',
      description: 'Obtém insights motivacionais sobre o progresso das metas. Use para dar feedback e motivação ao usuário sobre seu desempenho.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
];

export type ToolName =
  // Tarefas e Notificações (existentes)
  | 'create_task'
  | 'update_task_priority'
  | 'create_notification'
  | 'analyze_metrics'
  | 'create_insight'
  | 'get_tasks_summary'
  | 'get_clients_summary'
  | 'schedule_reminder'
  // Projetos (novas)
  | 'create_project'
  | 'update_project'
  | 'get_projects_summary'
  | 'get_project_details'
  | 'add_project_note'
  | 'get_project_tasks'
  // Calendário (novas)
  | 'get_upcoming_deadlines'
  | 'get_daily_schedule'
  | 'analyze_workload'
  | 'get_events_by_period'
  // Equipe (novas)
  | 'get_team_summary'
  | 'get_team_member_details'
  | 'get_team_hierarchy'
  | 'get_department_summary'
  | 'analyze_team_productivity'
  // Pagamentos (novas)
  | 'get_payments_summary'
  | 'get_pending_payments'
  | 'record_payment'
  | 'get_revenue_forecast'
  | 'analyze_payment_health'
  // Metas (novas)
  | 'get_current_goals'
  | 'set_goal'
  | 'suggest_goals'
  | 'get_goal_insights';

export interface ToolCallResult {
  success: boolean;
  data?: unknown;
  error?: string;
}
