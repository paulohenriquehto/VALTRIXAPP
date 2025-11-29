// =============================================
// SISTEMA DE PROSPECCAO - TYPES
// Kanban board para gestao de prospects
// =============================================

import type { Tag, User } from './index';

// =============================================
// ENUMS
// =============================================

export type ProspectPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ProspectStatus = 'open' | 'won' | 'lost' | 'archived';
export type InteractionType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'whatsapp'
  | 'linkedin'
  | 'proposal_sent'
  | 'follow_up'
  | 'note'
  | 'stage_change'
  | 'other';

// =============================================
// PIPELINE STAGE (Coluna do Kanban)
// =============================================

export interface PipelineStage {
  id: string;
  userId: string;
  name: string;
  color: string;
  position: number;
  isDefault: boolean;
  isWinStage: boolean;
  isLossStage: boolean;
  probability: number; // 0-100
  createdAt: string;
  updatedAt: string;

  // Computed (carregados com metricas)
  prospectCount?: number;
  totalValue?: number;
  weightedValue?: number;
}

export interface StageInput {
  name: string;
  color?: string;
  probability?: number;
  isWinStage?: boolean;
  isLossStage?: boolean;
}

export interface StageUpdate {
  name?: string;
  color?: string;
  probability?: number;
  isWinStage?: boolean;
  isLossStage?: boolean;
}

// =============================================
// PROSPECT (Card do Kanban)
// =============================================

export interface Prospect {
  id: string;
  userId: string;
  stageId: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  positionInStage: number;
  expectedValue: number;
  expectedCloseDate?: string;
  priority: ProspectPriority;
  status: ProspectStatus;
  source?: string;
  notes?: string;
  enteredStageAt: string;
  lastInteractionAt?: string;
  convertedClientId?: string;
  convertedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Relations (carregadas sob demanda)
  tags?: Tag[];
  stage?: PipelineStage;
  interactions?: ProspectInteraction[];
  interactionCount?: number;
}

export interface ProspectInput {
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  expectedValue?: number;
  expectedCloseDate?: string;
  priority?: ProspectPriority;
  source?: string;
  notes?: string;
  tagIds?: string[];
}

export interface ProspectUpdate {
  name?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  expectedValue?: number;
  expectedCloseDate?: string;
  priority?: ProspectPriority;
  source?: string;
  notes?: string;
  tagIds?: string[];
}

// =============================================
// INTERACAO (Historico de atividades)
// =============================================

export interface ProspectInteraction {
  id: string;
  prospectId: string;
  userId: string;
  type: InteractionType;
  title: string;
  description?: string;
  durationMinutes?: number;
  fromStageId?: string;
  toStageId?: string;
  createdAt: string;

  // Relations
  user?: User;
  fromStage?: PipelineStage;
  toStage?: PipelineStage;
}

export interface InteractionInput {
  type: InteractionType;
  title: string;
  description?: string;
  durationMinutes?: number;
}

// =============================================
// FILTROS
// =============================================

export interface ProspectFilters {
  search?: string;
  stageIds?: string[];
  priorities?: ProspectPriority[];
  statuses?: ProspectStatus[];
  sources?: string[];
  tagIds?: string[];
  minValue?: number;
  maxValue?: number;
  hasEmail?: boolean;
  hasPhone?: boolean;
  createdAfter?: string;
  createdBefore?: string;
  lastInteractionAfter?: string;
  lastInteractionBefore?: string;
}

// =============================================
// METRICAS
// =============================================

export interface StageMetrics {
  stageId: string;
  stageName: string;
  color: string;
  position: number;
  probability: number;
  prospectCount: number;
  totalValue: number;
  weightedValue: number;
}

export interface PipelineMetrics {
  totalProspects: number;
  totalValue: number;
  weightedValue: number;
  avgDealSize: number;
  byStage: StageMetrics[];
  byPriority: Record<ProspectPriority, number>;
  byStatus: Record<ProspectStatus, number>;
  conversionRate: number;
  avgTimeToClose: number; // em dias
}

export interface ProspectStats {
  totalOpen: number;
  totalWon: number;
  totalLost: number;
  totalValue: number;
  wonValue: number;
  lostValue: number;
  winRate: number;
}

// =============================================
// DRAG AND DROP
// =============================================

export interface DragEndResult {
  prospectId: string;
  sourceStageId: string;
  destinationStageId: string;
  sourceIndex: number;
  destinationIndex: number;
}

export interface ProspectMovePayload {
  prospectId: string;
  targetStageId: string;
  newPosition: number;
}

// =============================================
// LABELS E CORES
// =============================================

export const PriorityLabels: Record<ProspectPriority, string> = {
  low: 'Baixa',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

export const PriorityColors: Record<ProspectPriority, string> = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export const StatusLabels: Record<ProspectStatus, string> = {
  open: 'Aberto',
  won: 'Ganho',
  lost: 'Perdido',
  archived: 'Arquivado',
};

export const StatusColors: Record<ProspectStatus, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  won: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  lost: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  archived: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export const InteractionTypeLabels: Record<InteractionType, string> = {
  call: 'Ligacao',
  email: 'Email',
  meeting: 'Reuniao',
  whatsapp: 'WhatsApp',
  linkedin: 'LinkedIn',
  proposal_sent: 'Proposta Enviada',
  follow_up: 'Follow-up',
  note: 'Nota',
  stage_change: 'Mudanca de Estagio',
  other: 'Outro',
};

export const InteractionTypeIcons: Record<InteractionType, string> = {
  call: 'Phone',
  email: 'Mail',
  meeting: 'Calendar',
  whatsapp: 'MessageCircle',
  linkedin: 'Linkedin',
  proposal_sent: 'FileText',
  follow_up: 'RefreshCw',
  note: 'StickyNote',
  stage_change: 'ArrowRight',
  other: 'MoreHorizontal',
};

export const InteractionTypeColors: Record<InteractionType, string> = {
  call: 'text-green-600',
  email: 'text-blue-600',
  meeting: 'text-purple-600',
  whatsapp: 'text-green-500',
  linkedin: 'text-blue-700',
  proposal_sent: 'text-orange-600',
  follow_up: 'text-yellow-600',
  note: 'text-gray-600',
  stage_change: 'text-indigo-600',
  other: 'text-gray-500',
};

// =============================================
// DEFAULT STAGE COLORS
// =============================================

export const DefaultStageColors = [
  '#6B7280', // Gray
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#10B981', // Green
  '#EF4444', // Red
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
];

// =============================================
// ENUMS CONSTANTS
// =============================================

export const ProspectPriorities = {
  LOW: 'low' as ProspectPriority,
  MEDIUM: 'medium' as ProspectPriority,
  HIGH: 'high' as ProspectPriority,
  URGENT: 'urgent' as ProspectPriority,
};

export const ProspectStatuses = {
  OPEN: 'open' as ProspectStatus,
  WON: 'won' as ProspectStatus,
  LOST: 'lost' as ProspectStatus,
  ARCHIVED: 'archived' as ProspectStatus,
};

export const InteractionTypes = {
  CALL: 'call' as InteractionType,
  EMAIL: 'email' as InteractionType,
  MEETING: 'meeting' as InteractionType,
  WHATSAPP: 'whatsapp' as InteractionType,
  LINKEDIN: 'linkedin' as InteractionType,
  PROPOSAL_SENT: 'proposal_sent' as InteractionType,
  FOLLOW_UP: 'follow_up' as InteractionType,
  NOTE: 'note' as InteractionType,
  STAGE_CHANGE: 'stage_change' as InteractionType,
  OTHER: 'other' as InteractionType,
};

// =============================================
// SOURCES COMUNS
// =============================================

export const CommonSources = [
  'Indicacao',
  'LinkedIn',
  'Google',
  'Instagram',
  'Facebook',
  'Evento',
  'Cold Call',
  'Email Marketing',
  'Networking',
  'Site',
  'WhatsApp',
  'Outro',
];

// =============================================
// UTILS
// =============================================

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatCompactCurrency(value: number): string {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1)}K`;
  }
  return formatCurrency(value);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function getDaysInStage(enteredStageAt: string): number {
  const entered = new Date(enteredStageAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - entered.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
