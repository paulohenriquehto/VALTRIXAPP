// Types for Goals System - ValtrixApp

export type GoalStatus = 'behind' | 'on_track' | 'ahead' | 'achieved';

// Status da meta (ciclo de vida)
export type GoalStatusType = 'draft' | 'active' | 'completed' | 'expired';

// Tipos de periodo para metas
export type GoalPeriodType = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'custom';

export interface GoalMetric {
  target: number;
  current: number;
  progress: number;
  status: GoalStatus;
}

// Interface principal para metas (nova - suporta periodos)
export interface Goal {
  id: string;
  user_id: string;

  // Periodo
  period_type: GoalPeriodType;
  start_date: string; // ISO date
  end_date: string; // ISO date
  title: string;

  // Legacy - mantido para compatibilidade
  month?: string; // ISO date (first day of month)

  // Targets
  mrr_target: number;
  clients_target: number;
  tasks_target: number;
  projects_target: number;

  // Current progress
  mrr_current: number;
  clients_current: number;
  tasks_current: number;
  projects_current: number;

  // AI Suggestions
  mrr_suggested: number;
  clients_suggested: number;
  tasks_suggested: number;
  projects_suggested: number;

  is_confirmed: boolean;
  status: GoalStatusType;
  created_at: string;
  updated_at: string;
}

// @deprecated Use Goal interface instead
export interface MonthlyGoals {
  id: string;
  user_id: string;
  month: string; // ISO date (first day of month)

  // Novos campos de periodo (podem existir)
  period_type?: GoalPeriodType;
  start_date?: string;
  end_date?: string;
  title?: string;

  // Targets
  mrr_target: number;
  clients_target: number;
  tasks_target: number;
  projects_target: number;

  // Current progress
  mrr_current: number;
  clients_current: number;
  tasks_current: number;
  projects_current: number;

  // AI Suggestions
  mrr_suggested: number;
  clients_suggested: number;
  tasks_suggested: number;
  projects_suggested: number;

  is_confirmed: boolean;
  created_at: string;
  updated_at: string;
}

// Preset de periodo
export interface PeriodPreset {
  type: GoalPeriodType;
  label: string;
  description: string;
  durationDays: number | null; // null = variavel (mensal, trimestral)
}

// Presets disponiveis
export const PERIOD_PRESETS: PeriodPreset[] = [
  { type: 'weekly', label: 'Semanal', description: '7 dias', durationDays: 7 },
  { type: 'biweekly', label: 'Quinzenal', description: '14 dias', durationDays: 14 },
  { type: 'monthly', label: 'Mensal', description: 'Mês inteiro', durationDays: null },
  { type: 'quarterly', label: 'Trimestral', description: '3 meses', durationDays: null },
  { type: 'custom', label: 'Personalizado', description: 'Escolha as datas', durationDays: null },
];

// Labels para tipos de periodo
export const PERIOD_TYPE_LABELS: Record<GoalPeriodType, string> = {
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  custom: 'Personalizado',
};

// Cores para badges de periodo
export const PERIOD_TYPE_COLORS: Record<GoalPeriodType, string> = {
  weekly: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  biweekly: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  monthly: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  quarterly: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  custom: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

// Info de dias da meta
export interface GoalDayInfo {
  currentDay: number;
  totalDays: number;
  daysRemaining: number;
  percentElapsed: number;
}

// Input para criar/atualizar meta
export interface GoalInput {
  period_type: GoalPeriodType;
  start_date: string;
  end_date: string;
  title?: string;
  mrr_target: number;
  clients_target: number;
  tasks_target: number;
  projects_target: number;
}

// Filtros para lista de metas
export interface GoalFilters {
  status?: GoalStatusType | 'all';
  period_type?: GoalPeriodType;
  dateRange?: { start: string; end: string };
}

export interface GoalProgress {
  metric: 'mrr' | 'clients' | 'tasks' | 'projects';
  label: string;
  target: number;
  current: number;
  progress: number;
  status: GoalStatus;
  unit: string;
  prefix?: string;
}

export interface GoalInsight {
  type: 'success' | 'warning' | 'motivation' | 'suggestion' | 'reminder' | 'urgency' | 'almost';
  metric: string;
  message: string;
  priority: number;
}

export interface GoalSuggestions {
  mrr: number;
  clients: number;
  tasks: number;
  projects: number;
}

// Colors for progress bars based on status
export const GOAL_STATUS_COLORS: Record<GoalStatus, string> = {
  behind: 'bg-red-500',
  on_track: 'bg-yellow-500',
  ahead: 'bg-green-500',
  achieved: 'bg-emerald-500',
};

export const GOAL_STATUS_TEXT_COLORS: Record<GoalStatus, string> = {
  behind: 'text-red-600',
  on_track: 'text-yellow-600',
  ahead: 'text-green-600',
  achieved: 'text-emerald-600',
};

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  behind: 'Atrasado',
  on_track: 'No ritmo',
  ahead: 'Adiantado',
  achieved: 'Meta batida!',
};

export const METRIC_LABELS: Record<string, string> = {
  mrr: 'MRR',
  clients: 'Novos Clientes',
  tasks: 'Tarefas Concluídas',
  projects: 'Projetos Entregues',
};

export const METRIC_UNITS: Record<string, { unit: string; prefix?: string }> = {
  mrr: { unit: '', prefix: 'R$' },
  clients: { unit: 'clientes' },
  tasks: { unit: 'tarefas' },
  projects: { unit: 'projetos' },
};

// Labels para status da meta (ciclo de vida)
export const GOAL_STATUS_TYPE_LABELS: Record<GoalStatusType, string> = {
  draft: 'Rascunho',
  active: 'Ativa',
  completed: 'Concluida',
  expired: 'Expirada',
};

// Cores para badges de status da meta
export const GOAL_STATUS_TYPE_COLORS: Record<GoalStatusType, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};
