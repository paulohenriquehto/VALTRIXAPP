// Tipos principais do sistema
export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: Category;
  tags: Tag[];
  dueDate?: string;
  estimatedTime?: number; // em minutos
  actualTime?: number; // em minutos
  progress: number; // 0-100
  assignee?: User;
  createdBy: User;
  attachments?: Attachment[];
  comments?: Comment[];
  project?: Project;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  userId: string;
  isSystem: boolean;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  userId: string;
  usageCount: number;
  createdAt: string;
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: User;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  taskId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  user: User;
  entityType: 'task' | 'project' | 'comment';
  entityId: string;
  action: 'created' | 'updated' | 'deleted' | 'assigned' | 'completed';
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  createdAt: string;
}

// Tipos de autenticação
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  confirmPassword: string;
}

// Tipos de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Tipos de filtros
export interface TaskFilters {
  status?: ('pending' | 'in_progress' | 'completed' | 'archived')[];
  priority?: ('low' | 'medium' | 'high' | 'urgent')[];
  category?: string[];
  tags?: string[];
  assignee?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
}

// Tipos de dashboard
export interface DashboardStats {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  tasksByPriority: Record<string, number>;
  tasksByStatus: Record<string, number>;
  recentActivities: Activity[];
}

// Tipos de notificação
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'task_due' | 'task_overdue' | 'task_assigned' | 'task_completed' | 'ai_insight';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

// Tipos de configuração
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  notifications: {
    email: boolean;
    push: boolean;
    taskReminders: boolean;
    deadlineAlerts: boolean;
  };
  pomodoro: {
    workDuration: number;
    shortBreak: number;
    longBreak: number;
    longBreakInterval: number;
    autoStart: boolean;
    soundEnabled: boolean;
  };
}

// Tipos de formulário
export interface FormFieldError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FormFieldError[];
}

// Enums úteis
export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const;

export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export const ActivityType = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  ASSIGNED: 'assigned',
  COMPLETED: 'completed',
} as const;

// Tipos de Clientes e MRR
export interface Client {
  id: string;
  companyName: string;
  segment: ClientSegment;
  contactPerson: string;
  email: string;
  phone?: string;
  logoUrl?: string;

  // Tipo de cliente
  clientType: ClientType; // 'recurring' ou 'freelance'

  // Informações financeiras
  monthlyValue: number; // MRR para recorrentes ou Valor Total para freelance
  contractStartDate: string;
  paymentDueDay: number; // Dia do mês (1-31)
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;

  // Campos calculados para pagamentos parciais (freelance)
  totalPaid?: number; // Soma de todos os payments com status 'paid'
  remainingAmount?: number; // monthlyValue - totalPaid
  paymentProgress?: number; // Porcentagem paga (0-100)

  // Custo de Aquisição de Cliente (CAC) e ROI
  acquisitionCost?: number; // Custo total para adquirir o cliente (tráfego pago, indicação, etc.)
  roi?: number; // Return on Investment calculado: ((receita - CAC) / CAC) * 100
  realProfit?: number; // Lucro real: receita total - CAC

  // Status
  status: ClientStatus;
  notes?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: User;
}

export type ClientType = 'recurring' | 'freelance';

export type ClientSegment =
  | 'web_development'
  | 'software_development'
  | 'bug_fixing'
  | 'landing_pages'
  | 'microsites'
  | 'web_design'
  | 'ui_ux_design'
  | 'chatbot'
  | 'website_automation'
  | 'n8n_automation'
  | 'defy_automation'
  | 'agno_automation'
  | 'langchain_automation'
  | 'traffic_management'
  | 'seo'
  | 'consulting'
  | 'maintenance'
  | 'other';

export type PaymentStatus =
  | 'paid'
  | 'pending'
  | 'overdue'
  | 'cancelled'
  | 'installment';

export type PaymentMethod =
  | 'credit_card'
  | 'bank_transfer'
  | 'pix'
  | 'boleto'
  | 'paypal'
  | 'other';

export type ClientStatus =
  | 'active'
  | 'inactive'
  | 'trial'
  | 'churned'
  | 'completed';

export interface Payment {
  id: string;
  clientId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: PaymentStatus;
  method: PaymentMethod;
  notes?: string;
  installmentNumber?: number; // Número da parcela (1, 2, 3...)
  percentage?: number; // Porcentagem do valor total (0-100)
  createdAt: string;
}

export interface FreelanceMetrics {
  totalRevenue: number; // Soma total de clientes freelance
  revenuePaid: number; // Receita já recebida (total acumulado)
  revenuePending: number; // Receita a receber (pendente)
  monthlyRevenuePaid: number; // Receita recebida NO MÊS ATUAL
  activeFreelance: number; // Freelance ativos
  completedFreelance: number; // Freelance concluídos
  avgProjectValue: number; // Valor médio por projeto
  receivedPaymentsCount: number; // Quantidade de pagamentos recebidos
}

export interface MRRMetrics {
  // Métricas de clientes RECORRENTES apenas
  totalMRR: number;
  activeClients: number; // Apenas recorrentes ativos
  trialClients: number;
  churnedThisMonth: number;
  newThisMonth: number;
  avgRevenuePerClient: number;
  projectedAnnualRevenue: number;
  paymentsPending: number;
  paymentsOverdue: number;
  totalClients: number; // Total de clientes recorrentes

  // Previsões de receita (clientes recorrentes)
  upcomingRevenue7Days: number; // Receita esperada nos próximos 7 dias
  todayRevenue: number; // Receita esperada para hoje

  // Métricas de ROI e CAC (clientes recorrentes)
  totalAcquisitionCost: number; // Soma de todos os CACs de clientes recorrentes
  avgROI: number; // ROI médio dos clientes recorrentes
  realProfit: number; // Receita total - CAC total (clientes recorrentes)

  // Métricas de clientes FREELANCE (separadas)
  freelanceMetrics: FreelanceMetrics;
}

export const ClientSegments = {
  WEB_DEVELOPMENT: 'web_development',
  SOFTWARE_DEVELOPMENT: 'software_development',
  BUG_FIXING: 'bug_fixing',
  LANDING_PAGES: 'landing_pages',
  MICROSITES: 'microsites',
  WEB_DESIGN: 'web_design',
  UI_UX_DESIGN: 'ui_ux_design',
  CHATBOT: 'chatbot',
  WEBSITE_AUTOMATION: 'website_automation',
  N8N_AUTOMATION: 'n8n_automation',
  DEFY_AUTOMATION: 'defy_automation',
  AGNO_AUTOMATION: 'agno_automation',
  LANGCHAIN_AUTOMATION: 'langchain_automation',
  TRAFFIC_MANAGEMENT: 'traffic_management',
  SEO: 'seo',
  CONSULTING: 'consulting',
  MAINTENANCE: 'maintenance',
  OTHER: 'other',
} as const;

export const PaymentStatuses = {
  PAID: 'paid',
  PENDING: 'pending',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  INSTALLMENT: 'installment',
} as const;

export const ClientStatuses = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  TRIAL: 'trial',
  CHURNED: 'churned',
  COMPLETED: 'completed',
} as const;

// ============================================
// Tipos de Equipe, Hierarquia e Permissões
// ============================================

// Tipos de Cargo/Role (Hierarquia)
export type TeamRole =
  | 'ceo'
  | 'c_level'
  | 'director'
  | 'manager'
  | 'team_lead'
  | 'senior'
  | 'mid_level'
  | 'junior'
  | 'intern';

// Departamentos
export type Department =
  | 'engineering'
  | 'product'
  | 'design'
  | 'marketing'
  | 'sales'
  | 'customer_success'
  | 'finance'
  | 'hr'
  | 'operations'
  | 'other';

// Status do Membro
export type MemberStatus =
  | 'active'
  | 'inactive'
  | 'on_leave'
  | 'terminated';

// Escopo de Dados que o membro pode acessar
export type DataScope = 'all' | 'team' | 'own';

// Permissões de um módulo específico
export interface ModulePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

// Estrutura completa de permissões
export interface Permissions {
  // Permissões por módulo
  modules: {
    dashboard: ModulePermission;
    tasks: ModulePermission;
    clients: ModulePermission;
    calendar: ModulePermission;
    team: ModulePermission;
    analytics: ModulePermission;
    tags: ModulePermission;
    settings: ModulePermission;
  };

  // Permissões administrativas
  admin: {
    manageUsers: boolean;
    manageRoles: boolean;
    managePermissions: boolean;
    viewReports: boolean;
    exportData: boolean;
    manageBilling: boolean;
  };

  // Escopo de dados
  dataScope: DataScope;
}

// Membro da equipe
export interface TeamMember {
  id: string;
  user: User;
  role: TeamRole;
  department: Department;
  permissions: Permissions;

  // Hierarquia
  managerId?: string; // ID do gerente direto
  subordinates: string[]; // IDs dos subordinados diretos

  // Informações adicionais
  hireDate: string;
  salary?: number; // Opcional, só visível para CEO/HR
  status: MemberStatus;
  notes?: string; // Notas privadas (só CEO/gerente vê)

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Configuração de um cargo (define permissões padrão)
export interface RoleConfig {
  role: TeamRole;
  level: number; // 1 (CEO) a 9 (Intern)
  label: string;
  description: string;
  defaultPermissions: Permissions;
}

// Convite para novo membro
export interface TeamInvite {
  id: string;
  email: string;
  name: string;
  role: TeamRole;
  department: Department;
  permissions: Permissions;
  managerId?: string;
  invitedBy: User;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expiresAt: string;
  createdAt: string;
}

// Nó da árvore hierárquica (para visualização de organograma)
export interface OrgChartNode {
  member: TeamMember;
  children: OrgChartNode[];
}

// Histórico de alterações em permissões/cargo
export interface PermissionChange {
  id: string;
  memberId: string;
  changedBy: User;
  changeType: 'role_change' | 'permission_update' | 'status_change';
  oldValue: any;
  newValue: any;
  reason?: string;
  createdAt: string;
}

// Enums e Constantes
export const TeamRoles = {
  CEO: 'ceo',
  C_LEVEL: 'c_level',
  DIRECTOR: 'director',
  MANAGER: 'manager',
  TEAM_LEAD: 'team_lead',
  SENIOR: 'senior',
  MID_LEVEL: 'mid_level',
  JUNIOR: 'junior',
  INTERN: 'intern',
} as const;

export const Departments = {
  ENGINEERING: 'engineering',
  PRODUCT: 'product',
  DESIGN: 'design',
  MARKETING: 'marketing',
  SALES: 'sales',
  CUSTOMER_SUCCESS: 'customer_success',
  FINANCE: 'finance',
  HR: 'hr',
  OPERATIONS: 'operations',
  OTHER: 'other',
} as const;

export const MemberStatuses = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ON_LEAVE: 'on_leave',
  TERMINATED: 'terminated',
} as const;

// ============================================
// Tipos de Analytics e Métricas
// ============================================

// Período de análise
export type AnalyticsPeriod =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year'
  | 'custom';

// Range de datas customizado
export interface DateRange {
  startDate: string;
  endDate: string;
}

// Métricas Financeiras
export interface FinancialMetrics {
  // Receita
  totalRevenue: number; // Receita total acumulada
  monthlyRevenue: number; // Receita do mês atual
  previousMonthRevenue: number; // Receita do mês anterior
  revenueGrowth: number; // Crescimento % mês a mês

  // MRR e ARR
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue

  // Pagamentos
  paidInvoices: number; // Faturas pagas no período
  pendingInvoices: number; // Faturas pendentes
  overdueInvoices: number; // Faturas vencidas
  totalInvoices: number; // Total de faturas
  paymentSuccessRate: number; // Taxa de sucesso de pagamentos (%)

  // Clientes
  activeClients: number;
  newClients: number; // Novos clientes no período
  churnedClients: number; // Clientes perdidos no período
  totalClients: number;
  avgRevenuePerClient: number; // Ticket médio

  // LTV e CAC (Lifetime Value e Customer Acquisition Cost)
  ltv?: number; // Valor do tempo de vida do cliente
  cac?: number; // Custo de aquisição de cliente
  ltvCacRatio?: number; // Razão LTV/CAC

  // Tendência
  revenueByMonth: TrendData[];
  clientsGrowthByMonth: TrendData[];
}

// Métricas de Tarefas
export interface TaskMetrics {
  // Totais
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;

  // Taxas
  completionRate: number; // Taxa de conclusão (%)
  onTimeCompletionRate: number; // Taxa de conclusão no prazo (%)
  avgCompletionTime: number; // Tempo médio de conclusão (horas)

  // Por Prioridade
  tasksByPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };

  // Por Status
  tasksByStatus: {
    pending: number;
    in_progress: number;
    completed: number;
    archived: number;
  };

  // Tendências
  tasksCreatedByDay: TrendData[];
  tasksCompletedByDay: TrendData[];

  // Produtividade
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  tasksCompletedThisMonth: number;
  avgTasksPerDay: number;

  // Estimativas vs Real
  estimatedVsActualTime: {
    totalEstimated: number; // Total de horas estimadas
    totalActual: number; // Total de horas reais
    accuracy: number; // Precisão das estimativas (%)
  };
}

// Produtividade de um Membro
export interface MemberProductivity {
  memberId: string;
  memberName: string;
  memberRole: TeamRole;
  department: Department;
  avatarUrl?: string;

  // Tarefas
  tasksCompleted: number;
  tasksInProgress: number;
  tasksPending: number;
  tasksOverdue: number;

  // Desempenho
  completionRate: number; // Taxa de conclusão (%)
  onTimeRate: number; // Taxa de conclusão no prazo (%)
  avgCompletionTime: number; // Tempo médio de conclusão (horas)
  productivityScore: number; // Score de produtividade (0-100)

  // Tempo
  totalTimeSpent: number; // Total de horas trabalhadas
  avgTimePerTask: number; // Tempo médio por tarefa

  // Comparação
  performanceVsAvg: number; // Performance vs média da equipe (%)
  rank: number; // Posição no ranking de produtividade
}

// Métricas de Produtividade da Equipe
export interface TeamProductivityMetrics {
  // Geral
  totalMembers: number;
  activeMembers: number;

  // Produtividade agregada
  totalTasksCompleted: number;
  avgProductivityScore: number;
  avgCompletionRate: number;

  // Por Departamento
  productivityByDepartment: {
    department: Department;
    label: string;
    members: number;
    tasksCompleted: number;
    avgScore: number;
  }[];

  // Por Cargo
  productivityByRole: {
    role: TeamRole;
    label: string;
    members: number;
    tasksCompleted: number;
    avgScore: number;
  }[];

  // Rankings
  topPerformers: MemberProductivity[]; // Top 10
  bottomPerformers: MemberProductivity[]; // Bottom 10

  // Membros individuais
  allMemberProductivity: MemberProductivity[];
}

// Métricas Gerais (Consolidadas)
export interface OverallMetrics {
  financial: FinancialMetrics;
  tasks: TaskMetrics;
  teamProductivity: TeamProductivityMetrics;

  // Período de análise
  period: AnalyticsPeriod;
  dateRange: DateRange;

  // Metadata
  generatedAt: string;
  lastUpdated: string;
}

// Dados de Tendência (para gráficos)
export interface TrendData {
  date: string; // ISO date ou label
  value: number;
  label?: string; // Label customizado para exibição
  comparison?: number; // Valor de comparação (ex: período anterior)
}

// KPI Card Config
export interface KPICardData {
  id: string;
  title: string;
  value: number | string;
  unit?: string; // 'currency' | 'percent' | 'number' | 'time'
  trend?: {
    value: number; // % de mudança
    direction: 'up' | 'down' | 'stable';
    isPositive: boolean; // Se a tendência é positiva para este KPI
  };
  icon?: React.ReactNode;
  color?: string;
  description?: string;
}

// Configuração de Exportação
export interface ExportConfig {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  filename?: string;
  includeCharts?: boolean; // Para PDF
  sections?: string[]; // Seções a incluir
  dateRange?: DateRange;
}

// Filtros de Analytics
export interface AnalyticsFilters {
  period: AnalyticsPeriod;
  dateRange?: DateRange;
  departments?: Department[];
  roles?: TeamRole[];
  clients?: string[]; // IDs de clientes
  tags?: string[]; // IDs de tags
  includeArchived?: boolean;
}

// Comparação entre períodos
export interface PeriodComparison {
  current: {
    period: string;
    value: number;
  };
  previous: {
    period: string;
    value: number;
  };
  change: {
    absolute: number;
    percentage: number;
    direction: 'up' | 'down' | 'stable';
  };
}

// Insights automáticos
export interface AnalyticsInsight {
  id: string;
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  category: 'financial' | 'tasks' | 'productivity' | 'general';
  title: string;
  description: string;
  recommendation?: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

// Enums e Constantes
export const AnalyticsPeriods = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  LAST_7_DAYS: 'last_7_days',
  LAST_30_DAYS: 'last_30_days',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  THIS_QUARTER: 'this_quarter',
  LAST_QUARTER: 'last_quarter',
  THIS_YEAR: 'this_year',
  LAST_YEAR: 'last_year',
  CUSTOM: 'custom',
} as const;

// ============================================
// Tipos de Projetos
// ============================================

export type ProjectStatus =
  | 'planning'
  | 'active'
  | 'on_hold'
  | 'completed'
  | 'cancelled';

export interface Project {
  id: string;
  name: string;
  description?: string;
  client: Client;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  budget: number;
  createdBy: User;
  createdAt: string;
  updatedAt: string;

  // Computed fields (carregados sob demanda)
  notes?: ProjectNote[];
  documents?: ProjectDocument[];
  tasks?: Task[];
}

export interface ProjectNote {
  id: string;
  projectId: string;
  title: string;
  content: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  filename: string;
  originalName: string;
  fileType?: string;
  fileSize?: number;
  storagePath: string;
  uploadedBy: User;
  createdAt: string;
}

export const ProjectStatuses = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;