import {
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subDays,
  subMonths,
  subQuarters,
  subYears,
  isWithinInterval,
  differenceInDays,
  format,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type {
  AnalyticsPeriod,
  DateRange,
  FinancialMetrics,
  TaskMetrics,
  TeamProductivityMetrics,
  MemberProductivity,
  OverallMetrics,
  TrendData,
  Task,
  Client,
  Payment,
  TeamMember,
} from '../types';

/**
 * Converte período em DateRange
 */
export function periodToDateRange(period: AnalyticsPeriod): DateRange {
  const now = new Date();

  switch (period) {
    case 'today':
      return {
        startDate: startOfDay(now).toISOString(),
        endDate: endOfDay(now).toISOString(),
      };

    case 'yesterday':
      const yesterday = subDays(now, 1);
      return {
        startDate: startOfDay(yesterday).toISOString(),
        endDate: endOfDay(yesterday).toISOString(),
      };

    case 'last_7_days':
      return {
        startDate: startOfDay(subDays(now, 6)).toISOString(),
        endDate: endOfDay(now).toISOString(),
      };

    case 'last_30_days':
      return {
        startDate: startOfDay(subDays(now, 29)).toISOString(),
        endDate: endOfDay(now).toISOString(),
      };

    case 'this_month':
      return {
        startDate: startOfMonth(now).toISOString(),
        endDate: endOfMonth(now).toISOString(),
      };

    case 'last_month':
      const lastMonth = subMonths(now, 1);
      return {
        startDate: startOfMonth(lastMonth).toISOString(),
        endDate: endOfMonth(lastMonth).toISOString(),
      };

    case 'this_quarter':
      return {
        startDate: startOfQuarter(now).toISOString(),
        endDate: endOfQuarter(now).toISOString(),
      };

    case 'last_quarter':
      const lastQuarter = subQuarters(now, 1);
      return {
        startDate: startOfQuarter(lastQuarter).toISOString(),
        endDate: endOfQuarter(lastQuarter).toISOString(),
      };

    case 'this_year':
      return {
        startDate: startOfYear(now).toISOString(),
        endDate: endOfYear(now).toISOString(),
      };

    case 'last_year':
      const lastYear = subYears(now, 1);
      return {
        startDate: startOfYear(lastYear).toISOString(),
        endDate: endOfYear(lastYear).toISOString(),
      };

    default:
      // Para 'custom', retorna o mês atual por padrão
      return {
        startDate: startOfMonth(now).toISOString(),
        endDate: endOfMonth(now).toISOString(),
      };
  }
}

/**
 * Filtra itens por período
 */
export function filterByDateRange<T extends { createdAt: string }>(
  items: T[],
  dateRange: DateRange
): T[] {
  const start = parseISO(dateRange.startDate);
  const end = parseISO(dateRange.endDate);

  return items.filter((item) => {
    const itemDate = parseISO(item.createdAt);
    return isWithinInterval(itemDate, { start, end });
  });
}

/**
 * Calcula métricas financeiras
 */
export function calculateFinancialMetrics(
  clients: Client[],
  payments: Payment[],
  dateRange: DateRange
): FinancialMetrics {
  const now = new Date();
  const currentMonth = startOfMonth(now);
  const previousMonth = startOfMonth(subMonths(now, 1));
  const previousMonthEnd = endOfMonth(subMonths(now, 1));

  // Clientes ativos
  const activeClients = clients.filter((c) => c.status === 'active');

  // MRR (Monthly Recurring Revenue)
  const mrr = activeClients.reduce((sum, client) => sum + client.monthlyValue, 0);

  // ARR (Annual Recurring Revenue)
  const arr = mrr * 12;

  // Receita do mês atual
  const currentMonthPayments = payments.filter((p) => {
    const paidDate = p.paidDate ? parseISO(p.paidDate) : null;
    return (
      paidDate &&
      isWithinInterval(paidDate, { start: currentMonth, end: endOfMonth(now) })
    );
  });
  const monthlyRevenue = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);

  // Receita do mês anterior
  const previousMonthPayments = payments.filter((p) => {
    const paidDate = p.paidDate ? parseISO(p.paidDate) : null;
    return (
      paidDate && isWithinInterval(paidDate, { start: previousMonth, end: previousMonthEnd })
    );
  });
  const previousMonthRevenue = previousMonthPayments.reduce((sum, p) => sum + p.amount, 0);

  // Crescimento mês a mês
  const revenueGrowth =
    previousMonthRevenue > 0
      ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
      : 0;

  // Receita total acumulada
  const totalRevenue = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  // Pagamentos no período
  const periodPayments = filterByDateRange(payments, dateRange);
  const paidInvoices = periodPayments.filter((p) => p.status === 'paid').length;
  const pendingInvoices = periodPayments.filter((p) => p.status === 'pending').length;
  const overdueInvoices = periodPayments.filter((p) => p.status === 'overdue').length;
  const totalInvoices = periodPayments.length;

  // Taxa de sucesso de pagamentos
  const paymentSuccessRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0;

  // Novos clientes no período
  const newClients = filterByDateRange(clients, dateRange).length;

  // Clientes perdidos no período
  const churnedClients = filterByDateRange(
    clients.filter((c) => c.status === 'churned'),
    dateRange
  ).length;

  // Ticket médio
  const avgRevenuePerClient = activeClients.length > 0 ? mrr / activeClients.length : 0;

  // Receita por mês (últimos 12 meses)
  const revenueByMonth = generateMonthlyRevenue(payments, 12);

  // Crescimento de clientes por mês
  const clientsGrowthByMonth = generateClientsGrowth(clients, 12);

  return {
    totalRevenue,
    monthlyRevenue,
    previousMonthRevenue,
    revenueGrowth,
    mrr,
    arr,
    paidInvoices,
    pendingInvoices,
    overdueInvoices,
    totalInvoices,
    paymentSuccessRate,
    activeClients: activeClients.length,
    newClients,
    churnedClients,
    totalClients: clients.length,
    avgRevenuePerClient,
    revenueByMonth,
    clientsGrowthByMonth,
  };
}

/**
 * Gera dados de receita mensal
 */
function generateMonthlyRevenue(payments: Payment[], months: number): TrendData[] {
  const now = new Date();
  const result: TrendData[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    const monthPayments = payments.filter((p) => {
      const paidDate = p.paidDate ? parseISO(p.paidDate) : null;
      return (
        p.status === 'paid' &&
        paidDate &&
        isWithinInterval(paidDate, { start: monthStart, end: monthEnd })
      );
    });

    const revenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);

    result.push({
      date: monthStart.toISOString(),
      value: revenue,
      label: format(monthDate, 'MMM yyyy', { locale: ptBR }),
    });
  }

  return result;
}

/**
 * Gera dados de crescimento de clientes
 */
function generateClientsGrowth(clients: Client[], months: number): TrendData[] {
  const now = new Date();
  const result: TrendData[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    const newClients = clients.filter((c) => {
      const createdDate = parseISO(c.createdAt);
      return isWithinInterval(createdDate, { start: monthStart, end: monthEnd });
    });

    result.push({
      date: monthStart.toISOString(),
      value: newClients.length,
      label: format(monthDate, 'MMM yyyy', { locale: ptBR }),
    });
  }

  return result;
}

/**
 * Calcula métricas de tarefas
 */
export function calculateTaskMetrics(tasks: Task[], dateRange: DateRange): TaskMetrics {
  const now = new Date();

  // Totais
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length;

  // Tarefas vencidas
  const overdueTasks = tasks.filter((t) => {
    if (!t.dueDate || t.status === 'completed') return false;
    return parseISO(t.dueDate) < now;
  }).length;

  // Taxa de conclusão
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Taxa de conclusão no prazo
  const completedOnTime = tasks.filter((t) => {
    if (t.status !== 'completed' || !t.dueDate) return false;
    const dueDate = parseISO(t.dueDate);
    const completedDate = parseISO(t.updatedAt);
    return completedDate <= dueDate;
  }).length;
  const onTimeCompletionRate =
    completedTasks > 0 ? (completedOnTime / completedTasks) * 100 : 0;

  // Tempo médio de conclusão (em horas)
  const tasksWithTime = tasks.filter((t) => t.actualTime);
  const avgCompletionTime =
    tasksWithTime.length > 0
      ? tasksWithTime.reduce((sum, t) => sum + (t.actualTime || 0), 0) /
        tasksWithTime.length /
        60
      : 0;

  // Por prioridade
  const tasksByPriority = {
    low: tasks.filter((t) => t.priority === 'low').length,
    medium: tasks.filter((t) => t.priority === 'medium').length,
    high: tasks.filter((t) => t.priority === 'high').length,
    urgent: tasks.filter((t) => t.priority === 'urgent').length,
  };

  // Por status
  const tasksByStatus = {
    pending: pendingTasks,
    in_progress: inProgressTasks,
    completed: completedTasks,
    archived: tasks.filter((t) => t.status === 'archived').length,
  };

  // Tarefas criadas e completadas por dia (últimos 30 dias)
  const tasksCreatedByDay = generateDailyTasks(tasks, 30, 'created');
  const tasksCompletedByDay = generateDailyTasks(
    tasks.filter((t) => t.status === 'completed'),
    30,
    'completed'
  );

  // Produtividade
  const today = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const tasksCompletedToday = tasks.filter((t) => {
    if (t.status !== 'completed') return false;
    const completedDate = parseISO(t.updatedAt);
    return isWithinInterval(completedDate, { start: today, end: todayEnd });
  }).length;

  const tasksCompletedThisWeek = tasks.filter((t) => {
    if (t.status !== 'completed') return false;
    const completedDate = parseISO(t.updatedAt);
    return isWithinInterval(completedDate, { start: weekStart, end: now });
  }).length;

  const tasksCompletedThisMonth = tasks.filter((t) => {
    if (t.status !== 'completed') return false;
    const completedDate = parseISO(t.updatedAt);
    return isWithinInterval(completedDate, { start: monthStart, end: now });
  }).length;

  const daysInPeriod = differenceInDays(parseISO(dateRange.endDate), parseISO(dateRange.startDate)) || 1;
  const periodCompleted = filterByDateRange(
    tasks.filter((t) => t.status === 'completed'),
    dateRange
  ).length;
  const avgTasksPerDay = periodCompleted / daysInPeriod;

  // Estimativas vs Real
  const tasksWithEstimates = tasks.filter((t) => t.estimatedTime && t.actualTime);
  const totalEstimated = tasksWithEstimates.reduce((sum, t) => sum + (t.estimatedTime || 0), 0);
  const totalActual = tasksWithEstimates.reduce((sum, t) => sum + (t.actualTime || 0), 0);
  const accuracy =
    totalEstimated > 0 ? (1 - Math.abs(totalActual - totalEstimated) / totalEstimated) * 100 : 0;

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    overdueTasks,
    completionRate,
    onTimeCompletionRate,
    avgCompletionTime,
    tasksByPriority,
    tasksByStatus,
    tasksCreatedByDay,
    tasksCompletedByDay,
    tasksCompletedToday,
    tasksCompletedThisWeek,
    tasksCompletedThisMonth,
    avgTasksPerDay,
    estimatedVsActualTime: {
      totalEstimated,
      totalActual,
      accuracy,
    },
  };
}

/**
 * Gera dados diários de tarefas
 */
function generateDailyTasks(
  tasks: Task[],
  days: number,
  type: 'created' | 'completed'
): TrendData[] {
  const now = new Date();
  const result: TrendData[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const dayDate = subDays(now, i);
    const dayStart = startOfDay(dayDate);
    const dayEnd = endOfDay(dayDate);

    const dayTasks = tasks.filter((t) => {
      const checkDate = type === 'created' ? parseISO(t.createdAt) : parseISO(t.updatedAt);
      return isWithinInterval(checkDate, { start: dayStart, end: dayEnd });
    });

    result.push({
      date: dayStart.toISOString(),
      value: dayTasks.length,
      label: format(dayDate, 'dd/MM', { locale: ptBR }),
    });
  }

  return result;
}

/**
 * Calcula produtividade de um membro
 */
export function calculateMemberProductivity(
  member: TeamMember,
  tasks: Task[],
  dateRange: DateRange
): MemberProductivity {
  // Filtra tarefas do membro
  const memberTasks = tasks.filter((t) => t.assignee?.id === member.user.id);
  const periodTasks = filterByDateRange(memberTasks, dateRange);

  // Totais
  const tasksCompleted = periodTasks.filter((t) => t.status === 'completed').length;
  const tasksInProgress = periodTasks.filter((t) => t.status === 'in_progress').length;
  const tasksPending = periodTasks.filter((t) => t.status === 'pending').length;

  const now = new Date();
  const tasksOverdue = periodTasks.filter((t) => {
    if (!t.dueDate || t.status === 'completed') return false;
    return parseISO(t.dueDate) < now;
  }).length;

  // Taxa de conclusão
  const totalAssigned = periodTasks.length;
  const completionRate = totalAssigned > 0 ? (tasksCompleted / totalAssigned) * 100 : 0;

  // Taxa de conclusão no prazo
  const completedOnTime = periodTasks.filter((t) => {
    if (t.status !== 'completed' || !t.dueDate) return false;
    const dueDate = parseISO(t.dueDate);
    const completedDate = parseISO(t.updatedAt);
    return completedDate <= dueDate;
  }).length;
  const onTimeRate = tasksCompleted > 0 ? (completedOnTime / tasksCompleted) * 100 : 0;

  // Tempo médio de conclusão
  const completedWithTime = periodTasks.filter((t) => t.status === 'completed' && t.actualTime);
  const avgCompletionTime =
    completedWithTime.length > 0
      ? completedWithTime.reduce((sum, t) => sum + (t.actualTime || 0), 0) /
        completedWithTime.length /
        60
      : 0;

  // Tempo total
  const totalTimeSpent =
    periodTasks.reduce((sum, t) => sum + (t.actualTime || 0), 0) / 60;
  const avgTimePerTask = totalAssigned > 0 ? totalTimeSpent / totalAssigned : 0;

  // Score de produtividade (0-100)
  const productivityScore = calculateProductivityScore({
    completionRate,
    onTimeRate,
    tasksCompleted,
    avgCompletionTime,
  });

  return {
    memberId: member.id,
    memberName: member.user.fullName,
    memberRole: member.role,
    department: member.department,
    avatarUrl: member.user.avatarUrl,
    tasksCompleted,
    tasksInProgress,
    tasksPending,
    tasksOverdue,
    completionRate,
    onTimeRate,
    avgCompletionTime,
    productivityScore,
    totalTimeSpent,
    avgTimePerTask,
    performanceVsAvg: 0, // Será calculado depois na comparação com a equipe
    rank: 0, // Será calculado depois no ranking
  };
}

/**
 * Calcula score de produtividade (0-100)
 */
export function calculateProductivityScore(metrics: {
  completionRate: number;
  onTimeRate: number;
  tasksCompleted: number;
  avgCompletionTime: number;
}): number {
  // Pesos para cada métrica
  const weights = {
    completionRate: 0.4,
    onTimeRate: 0.3,
    volume: 0.2,
    efficiency: 0.1,
  };

  // Normaliza volume de tarefas (cap em 50 tarefas = 100 pontos)
  const volumeScore = Math.min((metrics.tasksCompleted / 50) * 100, 100);

  // Normaliza eficiência (menos tempo = melhor, cap em 2h = 100 pontos)
  const efficiencyScore =
    metrics.avgCompletionTime > 0
      ? Math.max(100 - (metrics.avgCompletionTime / 2) * 100, 0)
      : 0;

  // Calcula score final
  const score =
    metrics.completionRate * weights.completionRate +
    metrics.onTimeRate * weights.onTimeRate +
    volumeScore * weights.volume +
    efficiencyScore * weights.efficiency;

  return Math.round(Math.min(score, 100));
}

/**
 * Calcula métricas de produtividade da equipe
 */
export function calculateTeamProductivity(
  members: TeamMember[],
  tasks: Task[],
  dateRange: DateRange
): TeamProductivityMetrics {
  // Calcula produtividade de cada membro
  const allMemberProductivity = members
    .filter((m) => m.status === 'active')
    .map((member) => calculateMemberProductivity(member, tasks, dateRange));

  // Calcula média da equipe
  const avgProductivityScore =
    allMemberProductivity.length > 0
      ? allMemberProductivity.reduce((sum, m) => sum + m.productivityScore, 0) /
        allMemberProductivity.length
      : 0;

  const avgCompletionRate =
    allMemberProductivity.length > 0
      ? allMemberProductivity.reduce((sum, m) => sum + m.completionRate, 0) /
        allMemberProductivity.length
      : 0;

  // Calcula performanceVsAvg para cada membro
  allMemberProductivity.forEach((member) => {
    member.performanceVsAvg =
      avgProductivityScore > 0
        ? ((member.productivityScore - avgProductivityScore) / avgProductivityScore) * 100
        : 0;
  });

  // Ordena por score e atribui ranking
  const sorted = [...allMemberProductivity].sort(
    (a, b) => b.productivityScore - a.productivityScore
  );
  sorted.forEach((member, index) => {
    member.rank = index + 1;
  });

  // Top e bottom performers
  const topPerformers = sorted.slice(0, 10);
  const bottomPerformers = sorted.slice(-10).reverse();

  // Por departamento
  const departments = Array.from(new Set(members.map((m) => m.department)));
  const productivityByDepartment = departments.map((dept) => {
    const deptMembers = allMemberProductivity.filter((m) => m.department === dept);
    const tasksCompleted = deptMembers.reduce((sum, m) => sum + m.tasksCompleted, 0);
    const avgScore =
      deptMembers.length > 0
        ? deptMembers.reduce((sum, m) => sum + m.productivityScore, 0) / deptMembers.length
        : 0;

    return {
      department: dept,
      label: getDepartmentLabel(dept),
      members: deptMembers.length,
      tasksCompleted,
      avgScore: Math.round(avgScore),
    };
  });

  // Por cargo
  const roles = Array.from(new Set(members.map((m) => m.role)));
  const productivityByRole = roles.map((role) => {
    const roleMembers = allMemberProductivity.filter((m) => m.memberRole === role);
    const tasksCompleted = roleMembers.reduce((sum, m) => sum + m.tasksCompleted, 0);
    const avgScore =
      roleMembers.length > 0
        ? roleMembers.reduce((sum, m) => sum + m.productivityScore, 0) / roleMembers.length
        : 0;

    return {
      role,
      label: getRoleLabel(role),
      members: roleMembers.length,
      tasksCompleted,
      avgScore: Math.round(avgScore),
    };
  });

  return {
    totalMembers: members.length,
    activeMembers: members.filter((m) => m.status === 'active').length,
    totalTasksCompleted: allMemberProductivity.reduce((sum, m) => sum + m.tasksCompleted, 0),
    avgProductivityScore: Math.round(avgProductivityScore),
    avgCompletionRate: Math.round(avgCompletionRate),
    productivityByDepartment,
    productivityByRole,
    topPerformers,
    bottomPerformers,
    allMemberProductivity,
  };
}

/**
 * Calcula todas as métricas (consolidadas)
 */
export function calculateOverallMetrics(
  clients: Client[],
  payments: Payment[],
  tasks: Task[],
  members: TeamMember[],
  period: AnalyticsPeriod,
  customDateRange?: DateRange
): OverallMetrics {
  const dateRange = customDateRange || periodToDateRange(period);

  const financial = calculateFinancialMetrics(clients, payments, dateRange);
  const taskMetrics = calculateTaskMetrics(tasks, dateRange);
  const teamProductivity = calculateTeamProductivity(members, tasks, dateRange);

  return {
    financial,
    tasks: taskMetrics,
    teamProductivity,
    period,
    dateRange,
    generatedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Formata moeda (BRL)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata porcentagem
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formata número com separadores
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Formata tempo (horas)
 */
export function formatTime(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}min`;
  }
  return `${hours.toFixed(1)}h`;
}

/**
 * Obtém label de departamento
 */
function getDepartmentLabel(dept: string): string {
  const labels: Record<string, string> = {
    engineering: 'Engenharia',
    product: 'Produto',
    design: 'Design',
    marketing: 'Marketing',
    sales: 'Vendas',
    customer_success: 'Customer Success',
    finance: 'Financeiro',
    hr: 'RH',
    operations: 'Operações',
    other: 'Outro',
  };
  return labels[dept] || dept;
}

/**
 * Obtém label de cargo
 */
function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    ceo: 'CEO',
    c_level: 'C-Level',
    director: 'Diretor',
    manager: 'Gerente',
    team_lead: 'Tech Lead',
    senior: 'Sênior',
    mid_level: 'Pleno',
    junior: 'Júnior',
    intern: 'Estagiário',
  };
  return labels[role] || role;
}

/**
 * Calcula tendência (crescimento/decrescimento)
 */
export function calculateTrend(current: number, previous: number): {
  value: number;
  direction: 'up' | 'down' | 'stable';
  isPositive: boolean;
} {
  if (previous === 0) {
    return {
      value: current > 0 ? 100 : 0,
      direction: current > 0 ? 'up' : 'stable',
      isPositive: current > 0,
    };
  }

  const change = ((current - previous) / previous) * 100;

  return {
    value: Math.abs(change),
    direction: change > 1 ? 'up' : change < -1 ? 'down' : 'stable',
    isPositive: change > 0,
  };
}

/**
 * Obtém label do período
 */
export function getPeriodLabel(period: AnalyticsPeriod): string {
  const labels: Record<AnalyticsPeriod, string> = {
    today: 'Hoje',
    yesterday: 'Ontem',
    last_7_days: 'Últimos 7 dias',
    last_30_days: 'Últimos 30 dias',
    this_month: 'Este mês',
    last_month: 'Mês passado',
    this_quarter: 'Este trimestre',
    last_quarter: 'Trimestre passado',
    this_year: 'Este ano',
    last_year: 'Ano passado',
    custom: 'Personalizado',
  };
  return labels[period];
}
