// Types for Sales/Commercial System - ValtrixApp

export type SalesActivityType = 'contacts' | 'calls' | 'meetings' | 'proposals';
export type SalesServiceType = 'automation' | 'traffic' | 'sites' | 'bugs';
export type SalesPeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly';
export type SalesGoalStatus = 'draft' | 'active' | 'completed' | 'expired';

export interface SalesDailyActivity {
  id: string;
  user_id: string;
  date: string;

  // Atividades de prospecção
  contacts_sent: number;
  calls_made: number;
  meetings_held: number;
  proposals_sent: number;

  // Conversões
  leads_qualified: number;
  deals_closed: number;
  revenue_generated: number;

  // Por serviço
  service_automation: number;
  service_traffic: number;
  service_sites: number;
  service_bugs: number;

  // Notas
  notes: string | null;
  ai_feedback: string | null;

  created_at: string;
  updated_at: string;
}

export interface SalesGoal {
  id: string;
  user_id: string;
  period_type: SalesPeriodType;
  start_date: string;
  end_date: string;
  title: string | null;

  // Targets de atividades
  contacts_target: number;
  calls_target: number;
  meetings_target: number;
  proposals_target: number;

  // Targets de resultado
  leads_target: number;
  deals_target: number;
  revenue_target: number;

  status: SalesGoalStatus;
  created_at: string;
  updated_at: string;
}

export interface SalesStrategy {
  id: string;
  user_id: string;
  title: string;
  description: string;
  action_items: string[];
  based_on_analysis: string | null;
  expected_impact: string | null;
  status: 'suggested' | 'in_progress' | 'completed' | 'dismissed';
  created_at: string;
  updated_at: string;
}

export interface SalesCheckin {
  id: string;
  user_id: string;
  date: string;
  trigger_type: 'manual' | 'automatic' | 'chat';
  questions_asked: string[];
  responses: Record<string, unknown>;
  ai_summary: string | null;
  ai_suggestions: string[];
  completed_at: string | null;
  created_at: string;
}

// Métricas agregadas
export interface SalesSummary {
  period: string;
  totals: {
    contacts: number;
    calls: number;
    meetings: number;
    proposals: number;
    leads: number;
    deals: number;
    revenue: number;
  };
  averages: {
    contacts_per_day: number;
    calls_per_day: number;
    conversion_rate: number;
  };
  trends: {
    contacts_trend: number;
    calls_trend: number;
    deals_trend: number;
  };
  byService: {
    automation: number;
    traffic: number;
    sites: number;
    bugs: number;
  };
}

// Funil de vendas
export type FunnelStageType = 'lead' | 'qualified' | 'meeting' | 'proposal' | 'negotiation' | 'closed';

export interface SalesFunnelStage {
  stage: FunnelStageType;
  label: string;
  count: number;
  value: number;
  conversion_rate: number;
  color: string;
}

// Para gráficos
export interface SalesChartData {
  date: string;
  contacts: number;
  calls: number;
  meetings: number;
  proposals: number;
  deals: number;
}

// Input para criar/atualizar atividade
export interface SalesActivityInput {
  contacts_sent?: number;
  calls_made?: number;
  meetings_held?: number;
  proposals_sent?: number;
  leads_qualified?: number;
  deals_closed?: number;
  revenue_generated?: number;
  service_automation?: number;
  service_traffic?: number;
  service_sites?: number;
  service_bugs?: number;
  notes?: string;
}

// Input para criar/atualizar meta de vendas
export interface SalesGoalInput {
  period_type: SalesPeriodType;
  start_date: string;
  end_date: string;
  title?: string;
  contacts_target?: number;
  calls_target?: number;
  meetings_target?: number;
  proposals_target?: number;
  leads_target?: number;
  deals_target?: number;
  revenue_target?: number;
}

// Labels para atividades
export const ACTIVITY_LABELS: Record<SalesActivityType, string> = {
  contacts: 'Contatos Enviados',
  calls: 'Ligações',
  meetings: 'Reuniões',
  proposals: 'Propostas',
};

export const ACTIVITY_ICONS: Record<SalesActivityType, string> = {
  contacts: 'mail',
  calls: 'phone',
  meetings: 'users',
  proposals: 'file-text',
};

// Labels para serviços
export const SERVICE_LABELS: Record<SalesServiceType, string> = {
  automation: 'Automação',
  traffic: 'Gestão de Tráfego',
  sites: 'Sites/Landing Pages',
  bugs: 'Correção de Bugs',
};

export const SERVICE_COLORS: Record<SalesServiceType, string> = {
  automation: '#8B5CF6', // Purple
  traffic: '#3B82F6', // Blue
  sites: '#10B981', // Green
  bugs: '#F59E0B', // Amber
};

// Labels para períodos
export const PERIOD_LABELS: Record<SalesPeriodType, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
};

// Cores do funil
export const FUNNEL_COLORS: Record<FunnelStageType, string> = {
  lead: '#3B82F6',
  qualified: '#8B5CF6',
  meeting: '#F59E0B',
  proposal: '#F97316',
  negotiation: '#EF4444',
  closed: '#10B981',
};

// Labels do funil
export const FUNNEL_LABELS: Record<FunnelStageType, string> = {
  lead: 'Contatos',
  qualified: 'Qualificados',
  meeting: 'Reuniões',
  proposal: 'Propostas',
  negotiation: 'Negociação',
  closed: 'Fechados',
};
