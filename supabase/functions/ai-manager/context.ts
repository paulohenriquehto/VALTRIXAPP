// Context aggregation for AI Manager - ValtrixApp
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AggregatedContext {
  user: UserContext;
  tasks: TasksContext;
  clients: ClientsContext;
  projects: ProjectsContext;
  team: TeamContext;
  calendar: CalendarContext;
  payments: PaymentsContext;
  financial: FinancialContext;
  productivity: ProductivityContext;
  goals: GoalsContext;
  sales: SalesContext;
  timestamp: string;
}

interface SalesContext {
  has_activity: boolean;
  today: {
    contacts: number;
    calls: number;
    meetings: number;
    proposals: number;
    deals: number;
  };
  period_30_days: {
    total_contacts: number;
    total_calls: number;
    total_meetings: number;
    total_deals: number;
    total_revenue: number;
    conversion_rate: number;
  };
  streak: {
    current_count: number;
    longest_count: number;
    is_active: boolean;
  };
  active_goal: {
    has_goal: boolean;
    contacts_target: number;
    contacts_current: number;
    deals_target: number;
    deals_current: number;
    progress_percent: number;
  } | null;
  gamification: {
    level: number;
    total_points: number;
    xp_current: number;
    xp_to_next_level: number;
    recent_achievements: string[];
  };
}

interface GoalsContext {
  has_goals: boolean;
  is_confirmed: boolean;
  mrr: GoalMetric;
  clients: GoalMetric;
  tasks: GoalMetric;
  projects: GoalMetric;
  day_of_month: number;
  days_in_month: number;
  expected_progress: number;
  insights: Array<{
    type: string;
    metric: string;
    message: string;
    priority: number;
  }>;
}

interface GoalMetric {
  target: number;
  current: number;
  progress: number;
  status: 'behind' | 'on_track' | 'ahead' | 'achieved';
}

interface UserContext {
  id: string;
  name: string | null;
  email: string;
}

interface TasksContext {
  total: number;
  pending: number;
  in_progress: number;
  completed_today: number;
  completed_this_week: number;
  overdue: number;
  urgent: number;
  due_today: number;
  due_this_week: number;
  recent_tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
    client_name: string | null;
    project_name: string | null;
  }>;
}

interface ClientsContext {
  total: number;
  active: number;
  new_this_month: number;
  top_clients: Array<{
    id: string;
    name: string;
    mrr: number;
    tasks_count: number;
  }>;
}

interface FinancialContext {
  total_mrr: number;
  mrr_change_percent: number;
  revenue_concentration: number; // % do MRR vindo do top 3 clientes
  avg_client_value: number;
}

interface ProductivityContext {
  tasks_completed_today: number;
  tasks_completed_this_week: number;
  avg_completion_time_hours: number;
  completion_rate: number; // % de tarefas concluídas vs criadas
}

interface ProjectsContext {
  total: number;
  active: number;
  on_hold: number;
  completed_this_month: number;
  total_budget: number;
  recent_projects: Array<{
    id: string;
    name: string;
    status: string;
    client_name: string | null;
    end_date: string | null;
    tasks_count: number;
  }>;
}

interface TeamContext {
  total_members: number;
  active: number;
  by_department: Record<string, number>;
  by_role: Record<string, number>;
  recent_hires: Array<{
    id: string;
    name: string;
    role: string;
    department: string;
    hire_date: string;
  }>;
}

interface CalendarContext {
  events_today: number;
  events_this_week: number;
  upcoming_deadlines: Array<{
    id: string;
    title: string;
    type: 'task' | 'project' | 'payment';
    date: string;
    priority?: string;
  }>;
}

interface PaymentsContext {
  pending_count: number;
  pending_amount: number;
  overdue_count: number;
  overdue_amount: number;
  received_this_month: number;
  upcoming_7_days: Array<{
    id: string;
    client_name: string;
    amount: number;
    due_date: string;
    status: string;
  }>;
}

export async function aggregateContext(
  supabase: SupabaseClient,
  userId: string
): Promise<AggregatedContext> {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - now.getDay())).toISOString();

  // Fetch user data
  const { data: userData } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('id', userId)
    .single();

  // Fetch tasks with related data
  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      status,
      priority,
      due_date,
      created_at,
      completed_at,
      project_id,
      projects(name, clients(name))
    `)
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  // Fetch clients with MRR calculation
  const { data: clients } = await supabase
    .from('clients')
    .select(`
      id,
      company_name,
      status,
      monthly_value,
      created_at
    `)
    .eq('created_by', userId)
    .eq('status', 'active');

  // Fetch projects with client info
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      status,
      budget,
      end_date,
      created_at,
      client_id,
      clients(company_name)
    `)
    .eq('created_by', userId)
    .order('updated_at', { ascending: false });

  // Fetch team members (linked to current user's team)
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select(`
      id,
      role,
      department,
      status,
      hire_date,
      salary,
      user_id,
      users:user_id(full_name, email)
    `)
    .order('hire_date', { ascending: false });

  // Fetch payments
  const { data: payments } = await supabase
    .from('payments')
    .select(`
      id,
      amount,
      due_date,
      paid_date,
      status,
      client_id,
      clients(company_name)
    `)
    .order('due_date', { ascending: true });

  // Fetch goals for current month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const { data: goalsData } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('month', monthStart)
    .single();

  // Fetch goal insights
  const { data: goalInsights } = await supabase.rpc('generate_goal_insights', {
    p_user_id: userId
  });

  // Calculate task metrics
  const taskMetrics = calculateTaskMetrics(tasks || [], startOfDay, startOfWeek);

  // Calculate client metrics
  const clientMetrics = calculateClientMetrics(clients || [], startOfMonth);

  // Calculate financial metrics
  const financialMetrics = calculateFinancialMetrics(clients || []);

  // Calculate productivity metrics
  const productivityMetrics = calculateProductivityMetrics(tasks || [], startOfDay, startOfWeek);

  // Calculate projects metrics
  const projectsMetrics = calculateProjectsMetrics(projects || [], tasks || [], startOfMonth);

  // Calculate team metrics
  const teamMetrics = calculateTeamMetrics(teamMembers || [], startOfMonth);

  // Calculate calendar/deadline metrics
  const calendarMetrics = calculateCalendarMetrics(tasks || [], projects || [], payments || [], today, endOfWeek);

  // Calculate payments metrics
  const paymentsMetrics = calculatePaymentsMetrics(payments || [], today, startOfMonth);

  // Calculate goals metrics
  const goalsMetrics = calculateGoalsMetrics(goalsData, goalInsights || [], now);

  // Calculate sales metrics
  const salesMetrics = await calculateSalesMetrics(supabase, userId, today);

  return {
    user: {
      id: userId,
      name: userData?.full_name || null,
      email: userData?.email || '',
    },
    tasks: taskMetrics,
    clients: clientMetrics,
    projects: projectsMetrics,
    team: teamMetrics,
    calendar: calendarMetrics,
    payments: paymentsMetrics,
    financial: financialMetrics,
    productivity: productivityMetrics,
    goals: goalsMetrics,
    sales: salesMetrics,
    timestamp: now.toISOString(),
  };
}

function calculateTaskMetrics(
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
    created_at: string;
    completed_at: string | null;
    projects: { name: string; clients: { company_name: string } | null } | null;
  }>,
  startOfDay: string,
  startOfWeek: string
): TasksContext {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - now.getDay())).toISOString().split('T')[0];

  const pending = tasks.filter((t) => t.status === 'pending').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const completedToday = tasks.filter(
    (t) => t.status === 'completed' && t.completed_at && t.completed_at >= startOfDay
  ).length;
  const completedThisWeek = tasks.filter(
    (t) => t.status === 'completed' && t.completed_at && t.completed_at >= startOfWeek
  ).length;

  const overdue = tasks.filter(
    (t) => t.due_date && t.due_date < today && t.status !== 'completed'
  ).length;

  const urgent = tasks.filter(
    (t) => t.priority === 'urgent' && t.status !== 'completed'
  ).length;

  const dueToday = tasks.filter(
    (t) => t.due_date === today && t.status !== 'completed'
  ).length;

  const dueThisWeek = tasks.filter(
    (t) => t.due_date && t.due_date >= today && t.due_date <= weekEnd && t.status !== 'completed'
  ).length;

  const recentTasks = tasks.slice(0, 10).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    due_date: t.due_date,
    client_name: t.projects?.clients?.company_name || null,
    project_name: t.projects?.name || null,
  }));

  return {
    total: tasks.length,
    pending,
    in_progress: inProgress,
    completed_today: completedToday,
    completed_this_week: completedThisWeek,
    overdue,
    urgent,
    due_today: dueToday,
    due_this_week: dueThisWeek,
    recent_tasks: recentTasks,
  };
}

function calculateClientMetrics(
  clients: Array<{
    id: string;
    company_name: string;
    status: string;
    monthly_value: number | null;
    created_at: string;
  }>,
  startOfMonth: string
): ClientsContext {
  const activeClients = clients.filter((c) => c.status === 'active');
  const newThisMonth = clients.filter((c) => c.created_at >= startOfMonth).length;

  // Sort by MRR and get top clients
  const sortedByMrr = [...activeClients].sort((a, b) => (b.monthly_value || 0) - (a.monthly_value || 0));
  const topClients = sortedByMrr.slice(0, 5).map((c) => ({
    id: c.id,
    name: c.company_name,
    mrr: c.monthly_value || 0,
    tasks_count: 0, // Would need a join to get this
  }));

  return {
    total: clients.length,
    active: activeClients.length,
    new_this_month: newThisMonth,
    top_clients: topClients,
  };
}

function calculateFinancialMetrics(
  clients: Array<{
    id: string;
    company_name: string;
    monthly_value: number | null;
  }>
): FinancialContext {
  const totalMrr = clients.reduce((sum, c) => sum + (c.monthly_value || 0), 0);
  const avgClientValue = clients.length > 0 ? totalMrr / clients.length : 0;

  // Calculate revenue concentration (top 3 clients)
  const sortedByMrr = [...clients].sort((a, b) => (b.monthly_value || 0) - (a.monthly_value || 0));
  const top3Mrr = sortedByMrr.slice(0, 3).reduce((sum, c) => sum + (c.monthly_value || 0), 0);
  const revenueConcentration = totalMrr > 0 ? (top3Mrr / totalMrr) * 100 : 0;

  return {
    total_mrr: totalMrr,
    mrr_change_percent: 0, // Would need historical data
    revenue_concentration: Math.round(revenueConcentration * 10) / 10,
    avg_client_value: Math.round(avgClientValue * 100) / 100,
  };
}

function calculateProductivityMetrics(
  tasks: Array<{
    status: string;
    created_at: string;
    completed_at: string | null;
  }>,
  startOfDay: string,
  startOfWeek: string
): ProductivityContext {
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const completedToday = completedTasks.filter(
    (t) => t.completed_at && t.completed_at >= startOfDay
  ).length;
  const completedThisWeek = completedTasks.filter(
    (t) => t.completed_at && t.completed_at >= startOfWeek
  ).length;

  // Calculate average completion time
  const tasksWithTime = completedTasks.filter((t) => t.completed_at && t.created_at);
  let avgCompletionTime = 0;
  if (tasksWithTime.length > 0) {
    const totalHours = tasksWithTime.reduce((sum, t) => {
      const created = new Date(t.created_at);
      const completed = new Date(t.completed_at!);
      const hours = (completed.getTime() - created.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);
    avgCompletionTime = totalHours / tasksWithTime.length;
  }

  // Calculate completion rate
  const completionRate =
    tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  return {
    tasks_completed_today: completedToday,
    tasks_completed_this_week: completedThisWeek,
    avg_completion_time_hours: Math.round(avgCompletionTime * 10) / 10,
    completion_rate: Math.round(completionRate * 10) / 10,
  };
}

function calculateProjectsMetrics(
  projects: Array<{
    id: string;
    name: string;
    status: string;
    budget: number | null;
    end_date: string | null;
    created_at: string;
    client_id: string | null;
    clients: { company_name: string } | null;
  }>,
  tasks: Array<{ project_id: string | null }>,
  startOfMonth: string
): ProjectsContext {
  const active = projects.filter((p) => p.status === 'active').length;
  const onHold = projects.filter((p) => p.status === 'on_hold').length;
  const completedThisMonth = projects.filter(
    (p) => p.status === 'completed' && p.created_at >= startOfMonth
  ).length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);

  // Get recent projects with task count
  const recentProjects = projects.slice(0, 5).map((p) => {
    const tasksCount = tasks.filter((t) => t.project_id === p.id).length;
    return {
      id: p.id,
      name: p.name,
      status: p.status,
      client_name: p.clients?.company_name || null,
      end_date: p.end_date,
      tasks_count: tasksCount,
    };
  });

  return {
    total: projects.length,
    active,
    on_hold: onHold,
    completed_this_month: completedThisMonth,
    total_budget: totalBudget,
    recent_projects: recentProjects,
  };
}

function calculateTeamMetrics(
  teamMembers: Array<{
    id: string;
    role: string;
    department: string;
    status: string;
    hire_date: string;
    salary: number | null;
    users: { full_name: string; email: string } | null;
  }>,
  startOfMonth: string
): TeamContext {
  const activeMembers = teamMembers.filter((m) => m.status === 'active');

  // Count by department
  const byDepartment: Record<string, number> = {};
  activeMembers.forEach((m) => {
    byDepartment[m.department] = (byDepartment[m.department] || 0) + 1;
  });

  // Count by role
  const byRole: Record<string, number> = {};
  activeMembers.forEach((m) => {
    byRole[m.role] = (byRole[m.role] || 0) + 1;
  });

  // Recent hires (last 3 months or newest 5)
  const recentHires = teamMembers
    .filter((m) => m.status === 'active')
    .slice(0, 5)
    .map((m) => ({
      id: m.id,
      name: m.users?.full_name || 'Sem nome',
      role: m.role,
      department: m.department,
      hire_date: m.hire_date,
    }));

  return {
    total_members: teamMembers.length,
    active: activeMembers.length,
    by_department: byDepartment,
    by_role: byRole,
    recent_hires: recentHires,
  };
}

function calculateCalendarMetrics(
  tasks: Array<{
    id: string;
    title: string;
    due_date: string | null;
    status: string;
    priority: string;
  }>,
  projects: Array<{
    id: string;
    name: string;
    end_date: string | null;
    status: string;
  }>,
  payments: Array<{
    id: string;
    due_date: string | null;
    status: string;
    clients: { company_name: string } | null;
  }>,
  today: string,
  endOfWeek: string
): CalendarContext {
  const upcomingDeadlines: CalendarContext['upcoming_deadlines'] = [];

  // Task deadlines
  tasks
    .filter((t) => t.due_date && t.due_date >= today && t.due_date <= endOfWeek && t.status !== 'completed')
    .forEach((t) => {
      upcomingDeadlines.push({
        id: t.id,
        title: t.title,
        type: 'task',
        date: t.due_date!,
        priority: t.priority,
      });
    });

  // Project deadlines
  projects
    .filter((p) => p.end_date && p.end_date >= today && p.end_date <= endOfWeek && p.status === 'active')
    .forEach((p) => {
      upcomingDeadlines.push({
        id: p.id,
        title: `Projeto: ${p.name}`,
        type: 'project',
        date: p.end_date!,
      });
    });

  // Payment deadlines
  payments
    .filter((p) => p.due_date && p.due_date >= today && p.due_date <= endOfWeek && p.status === 'pending')
    .forEach((p) => {
      upcomingDeadlines.push({
        id: p.id,
        title: `Pagamento: ${p.clients?.company_name || 'Cliente'}`,
        type: 'payment',
        date: p.due_date!,
      });
    });

  // Sort by date
  upcomingDeadlines.sort((a, b) => a.date.localeCompare(b.date));

  const eventsToday = upcomingDeadlines.filter((e) => e.date === today).length;
  const eventsThisWeek = upcomingDeadlines.length;

  return {
    events_today: eventsToday,
    events_this_week: eventsThisWeek,
    upcoming_deadlines: upcomingDeadlines.slice(0, 10),
  };
}

function calculatePaymentsMetrics(
  payments: Array<{
    id: string;
    amount: number;
    due_date: string | null;
    paid_date: string | null;
    status: string;
    client_id: string | null;
    clients: { company_name: string } | null;
  }>,
  today: string,
  startOfMonth: string
): PaymentsContext {
  const pending = payments.filter((p) => p.status === 'pending');
  const overdue = payments.filter(
    (p) => p.status === 'pending' && p.due_date && p.due_date < today
  );
  const paidThisMonth = payments.filter(
    (p) => p.status === 'paid' && p.paid_date && p.paid_date >= startOfMonth
  );

  const pendingAmount = pending.reduce((sum, p) => sum + (p.amount || 0), 0);
  const overdueAmount = overdue.reduce((sum, p) => sum + (p.amount || 0), 0);
  const receivedThisMonth = paidThisMonth.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Upcoming 7 days
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  const sevenDaysStr = sevenDaysLater.toISOString().split('T')[0];

  const upcoming7Days = payments
    .filter(
      (p) =>
        p.status === 'pending' &&
        p.due_date &&
        p.due_date >= today &&
        p.due_date <= sevenDaysStr
    )
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      client_name: p.clients?.company_name || 'Cliente',
      amount: p.amount || 0,
      due_date: p.due_date!,
      status: p.status,
    }));

  return {
    pending_count: pending.length,
    pending_amount: pendingAmount,
    overdue_count: overdue.length,
    overdue_amount: overdueAmount,
    received_this_month: receivedThisMonth,
    upcoming_7_days: upcoming7Days,
  };
}

function calculateGoalsMetrics(
  goalsData: {
    id: string;
    mrr_target: number;
    mrr_current: number;
    clients_target: number;
    clients_current: number;
    tasks_target: number;
    tasks_current: number;
    projects_target: number;
    projects_current: number;
    is_confirmed: boolean;
  } | null,
  goalInsights: Array<{
    insight_type: string;
    metric: string;
    message: string;
    priority: number;
  }>,
  now: Date
): GoalsContext {
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const expectedProgress = (dayOfMonth / daysInMonth) * 100;

  if (!goalsData) {
    return {
      has_goals: false,
      is_confirmed: false,
      mrr: { target: 0, current: 0, progress: 0, status: 'behind' },
      clients: { target: 0, current: 0, progress: 0, status: 'behind' },
      tasks: { target: 0, current: 0, progress: 0, status: 'behind' },
      projects: { target: 0, current: 0, progress: 0, status: 'behind' },
      day_of_month: dayOfMonth,
      days_in_month: daysInMonth,
      expected_progress: Math.round(expectedProgress),
      insights: [],
    };
  }

  const getStatus = (progress: number): 'behind' | 'on_track' | 'ahead' | 'achieved' => {
    if (progress >= 100) return 'achieved';
    if (progress >= expectedProgress * 0.9) return 'ahead';
    if (progress >= expectedProgress * 0.5) return 'on_track';
    return 'behind';
  };

  const calcProgress = (current: number, target: number): number => {
    if (target <= 0) return 0;
    return Math.round((current / target) * 100 * 10) / 10;
  };

  const mrrProgress = calcProgress(goalsData.mrr_current, goalsData.mrr_target);
  const clientsProgress = calcProgress(goalsData.clients_current, goalsData.clients_target);
  const tasksProgress = calcProgress(goalsData.tasks_current, goalsData.tasks_target);
  const projectsProgress = calcProgress(goalsData.projects_current, goalsData.projects_target);

  return {
    has_goals: true,
    is_confirmed: goalsData.is_confirmed,
    mrr: {
      target: goalsData.mrr_target,
      current: goalsData.mrr_current,
      progress: mrrProgress,
      status: getStatus(mrrProgress),
    },
    clients: {
      target: goalsData.clients_target,
      current: goalsData.clients_current,
      progress: clientsProgress,
      status: getStatus(clientsProgress),
    },
    tasks: {
      target: goalsData.tasks_target,
      current: goalsData.tasks_current,
      progress: tasksProgress,
      status: getStatus(tasksProgress),
    },
    projects: {
      target: goalsData.projects_target,
      current: goalsData.projects_current,
      progress: projectsProgress,
      status: getStatus(projectsProgress),
    },
    day_of_month: dayOfMonth,
    days_in_month: daysInMonth,
    expected_progress: Math.round(expectedProgress),
    insights: goalInsights.map(i => ({
      type: i.insight_type,
      metric: i.metric,
      message: i.message,
      priority: i.priority,
    })),
  };
}

export function formatContextForPrompt(context: AggregatedContext): string {
  const { user, tasks, clients, projects, team, calendar, payments, financial, productivity, goals, sales } = context;

  // Format goals section
  const goalsSection = formatGoalsSection(goals);

  // Format sales section
  const salesSection = formatSalesSection(sales);

  return `### Usuário
- Nome: ${user.name || 'Não informado'}
- Email: ${user.email}

### Tarefas
- Total: ${tasks.total} tarefas
- Pendentes: ${tasks.pending}
- Em progresso: ${tasks.in_progress}
- Concluídas hoje: ${tasks.completed_today}
- Concluídas esta semana: ${tasks.completed_this_week}
- **Atrasadas: ${tasks.overdue}** ${tasks.overdue > 0 ? '⚠️' : ''}
- **Urgentes: ${tasks.urgent}** ${tasks.urgent > 0 ? '🔴' : ''}
- Vencem hoje: ${tasks.due_today}
- Vencem esta semana: ${tasks.due_this_week}

### Projetos
- Total: ${projects.total} projetos
- Ativos: ${projects.active}
- Em espera: ${projects.on_hold}
- Concluídos este mês: ${projects.completed_this_month}
- Budget total: R$ ${projects.total_budget.toLocaleString('pt-BR')}
${projects.recent_projects.length > 0 ? `- Projetos recentes:\n${projects.recent_projects.slice(0, 3).map((p) => `  • ${p.name} (${p.status})${p.client_name ? ` - ${p.client_name}` : ''} - ${p.tasks_count} tarefas`).join('\n')}` : ''}

### Equipe
- Total de membros: ${team.total_members}
- Membros ativos: ${team.active}
- Por departamento: ${Object.entries(team.by_department).map(([dept, count]) => `${dept}: ${count}`).join(', ') || 'Nenhum'}
- Por cargo: ${Object.entries(team.by_role).map(([role, count]) => `${role}: ${count}`).join(', ') || 'Nenhum'}
${team.recent_hires.length > 0 ? `- Contratações recentes:\n${team.recent_hires.slice(0, 3).map((m) => `  • ${m.name} - ${m.role || 'Sem cargo'} (${m.department || 'Sem depto'})`).join('\n')}` : ''}

### Calendário
- Eventos hoje: ${calendar.events_today}
- Eventos esta semana: ${calendar.events_this_week}
${calendar.upcoming_deadlines.length > 0 ? `- Próximos prazos:\n${calendar.upcoming_deadlines.slice(0, 5).map((d) => `  • [${d.type.toUpperCase()}] ${d.title} - ${new Date(d.date).toLocaleDateString('pt-BR')}${d.priority ? ` (${d.priority})` : ''}`).join('\n')}` : '- Nenhum prazo próximo'}

### Pagamentos
- Pendentes: ${payments.pending_count} (R$ ${payments.pending_amount.toLocaleString('pt-BR')})
- **Atrasados: ${payments.overdue_count} (R$ ${payments.overdue_amount.toLocaleString('pt-BR')})** ${payments.overdue_count > 0 ? '⚠️' : ''}
- Recebido este mês: R$ ${payments.received_this_month.toLocaleString('pt-BR')}
${payments.upcoming_7_days.length > 0 ? `- Próximos 7 dias:\n${payments.upcoming_7_days.map((p) => `  • ${p.client_name}: R$ ${p.amount.toLocaleString('pt-BR')} - vence ${new Date(p.due_date).toLocaleDateString('pt-BR')}`).join('\n')}` : ''}

### Clientes
- Total de clientes: ${clients.total}
- Clientes ativos: ${clients.active}
- Novos este mês: ${clients.new_this_month}
- Top clientes por MRR:
${clients.top_clients.map((c, i) => `  ${i + 1}. ${c.name}: R$ ${c.mrr.toLocaleString('pt-BR')}`).join('\n')}

### Financeiro
- **MRR Total: R$ ${financial.total_mrr.toLocaleString('pt-BR')}**
- Valor médio por cliente: R$ ${financial.avg_client_value.toLocaleString('pt-BR')}
- Concentração de receita (top 3): ${financial.revenue_concentration}%

### Produtividade
- Tarefas concluídas hoje: ${productivity.tasks_completed_today}
- Tarefas concluídas esta semana: ${productivity.tasks_completed_this_week}
- Tempo médio de conclusão: ${productivity.avg_completion_time_hours}h
- Taxa de conclusão: ${productivity.completion_rate}%

### Tarefas Recentes
${tasks.recent_tasks.slice(0, 5).map((t) => `- [${t.priority.toUpperCase()}] ${t.title} (${t.status})${t.client_name ? ` - ${t.client_name}` : ''}`).join('\n')}

${goalsSection}

${salesSection}`;
}

async function calculateSalesMetrics(
  supabase: SupabaseClient,
  userId: string,
  today: string
): Promise<SalesContext> {
  // Buscar atividade de hoje
  const { data: todayActivity } = await supabase
    .from('sales_daily_activities')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  // Buscar atividades dos últimos 30 dias
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const { data: activities } = await supabase
    .from('sales_daily_activities')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', today);

  // Calcular totais do período
  const totals = (activities || []).reduce(
    (acc, a) => ({
      contacts: acc.contacts + (a.contacts_sent || 0),
      calls: acc.calls + (a.calls_made || 0),
      meetings: acc.meetings + (a.meetings_held || 0),
      deals: acc.deals + (a.deals_closed || 0),
      revenue: acc.revenue + (a.revenue_generated || 0),
    }),
    { contacts: 0, calls: 0, meetings: 0, deals: 0, revenue: 0 }
  );

  const conversionRate = totals.contacts > 0
    ? Math.round((totals.deals / totals.contacts) * 100 * 100) / 100
    : 0;

  // Buscar streak
  const { data: streak } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .eq('streak_type', 'daily_prospecting')
    .single();

  // Verificar se streak está ativo
  let isStreakActive = false;
  if (streak?.last_activity_date) {
    const lastDate = new Date(streak.last_activity_date);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    isStreakActive = diffDays <= 1;
  }

  // Buscar meta de vendas ativa
  const { data: activeGoal } = await supabase
    .from('sales_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .lte('start_date', today)
    .gte('end_date', today)
    .single();

  // Buscar gamification
  const { data: gamification } = await supabase
    .from('user_gamification')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Buscar achievements recentes (últimos 7 dias)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { data: recentAchievements } = await supabase
    .from('user_achievements')
    .select('*, achievement:achievements(name)')
    .eq('user_id', userId)
    .gte('unlocked_at', sevenDaysAgo.toISOString())
    .order('unlocked_at', { ascending: false })
    .limit(3);

  return {
    has_activity: !!todayActivity || (activities?.length || 0) > 0,
    today: {
      contacts: todayActivity?.contacts_sent || 0,
      calls: todayActivity?.calls_made || 0,
      meetings: todayActivity?.meetings_held || 0,
      proposals: todayActivity?.proposals_sent || 0,
      deals: todayActivity?.deals_closed || 0,
    },
    period_30_days: {
      total_contacts: totals.contacts,
      total_calls: totals.calls,
      total_meetings: totals.meetings,
      total_deals: totals.deals,
      total_revenue: totals.revenue,
      conversion_rate: conversionRate,
    },
    streak: {
      current_count: isStreakActive ? (streak?.current_count || 0) : 0,
      longest_count: streak?.longest_count || 0,
      is_active: isStreakActive,
    },
    active_goal: activeGoal ? {
      has_goal: true,
      contacts_target: activeGoal.contacts_target || 0,
      contacts_current: totals.contacts,
      deals_target: activeGoal.deals_target || 0,
      deals_current: totals.deals,
      progress_percent: activeGoal.contacts_target > 0
        ? Math.round((totals.contacts / activeGoal.contacts_target) * 100)
        : 0,
    } : null,
    gamification: {
      level: gamification?.current_level || 1,
      total_points: gamification?.total_points || 0,
      xp_current: gamification?.xp_current || 0,
      xp_to_next_level: gamification?.xp_to_next_level || 100,
      recent_achievements: (recentAchievements || []).map(
        (a: { achievement?: { name: string } }) => a.achievement?.name || ''
      ).filter(Boolean),
    },
  };
}

function formatGoalsSection(goals: GoalsContext): string {
  if (!goals.has_goals) {
    return `### Metas do Mês
- **Sem metas definidas para este mês**
- Dia do mês: ${goals.day_of_month}/${goals.days_in_month}
- Sugestão: Pergunte ao usuário se deseja definir metas mensais`;
  }

  const statusEmoji = (status: string): string => {
    switch (status) {
      case 'achieved': return '✅';
      case 'ahead': return '🟢';
      case 'on_track': return '🟡';
      case 'behind': return '🔴';
      default: return '⚪';
    }
  };

  const statusText = (status: string): string => {
    switch (status) {
      case 'achieved': return 'Meta batida!';
      case 'ahead': return 'Adiantado';
      case 'on_track': return 'No ritmo';
      case 'behind': return 'Atrasado';
      default: return 'Sem dados';
    }
  };

  let section = `### Metas do Mês ${goals.is_confirmed ? '' : '(NÃO CONFIRMADAS)'}
- Dia do mês: ${goals.day_of_month}/${goals.days_in_month} (${goals.expected_progress}% esperado)

**MRR:** ${statusEmoji(goals.mrr.status)} R$ ${goals.mrr.current.toLocaleString('pt-BR')} / R$ ${goals.mrr.target.toLocaleString('pt-BR')} (${goals.mrr.progress}%) - ${statusText(goals.mrr.status)}
**Clientes:** ${statusEmoji(goals.clients.status)} ${goals.clients.current} / ${goals.clients.target} (${goals.clients.progress}%) - ${statusText(goals.clients.status)}
**Tarefas:** ${statusEmoji(goals.tasks.status)} ${goals.tasks.current} / ${goals.tasks.target} (${goals.tasks.progress}%) - ${statusText(goals.tasks.status)}
**Projetos:** ${statusEmoji(goals.projects.status)} ${goals.projects.current} / ${goals.projects.target} (${goals.projects.progress}%) - ${statusText(goals.projects.status)}`;

  if (goals.insights.length > 0) {
    section += `\n\n**Insights de Metas:**`;
    goals.insights.slice(0, 3).forEach(insight => {
      section += `\n- [${insight.type.toUpperCase()}] ${insight.message}`;
    });
  }

  return section;
}

function formatSalesSection(sales: SalesContext): string {
  if (!sales.has_activity) {
    return `### Vendas/Prospecção
- **Sem atividades de vendas registradas**
- Comece a registrar suas atividades comerciais para ter insights!
- Dica: Informe quantos contatos, ligações e reuniões você faz diariamente`;
  }

  const streakEmoji = sales.streak.is_active
    ? (sales.streak.current_count >= 7 ? '🔥' : '✨')
    : '💤';

  let section = `### Vendas/Prospecção

**Atividades de Hoje:**
- Contatos enviados: ${sales.today.contacts}
- Ligações realizadas: ${sales.today.calls}
- Reuniões: ${sales.today.meetings}
- Propostas: ${sales.today.proposals}
- Negócios fechados: ${sales.today.deals}

**Últimos 30 dias:**
- Total de contatos: ${sales.period_30_days.total_contacts}
- Total de ligações: ${sales.period_30_days.total_calls}
- Total de reuniões: ${sales.period_30_days.total_meetings}
- Negócios fechados: ${sales.period_30_days.total_deals}
- Receita gerada: R$ ${sales.period_30_days.total_revenue.toLocaleString('pt-BR')}
- Taxa de conversão: ${sales.period_30_days.conversion_rate}%

**Streak de Prospecção:** ${streakEmoji}
- Dias consecutivos: ${sales.streak.current_count}
- Maior streak: ${sales.streak.longest_count} dias
- Status: ${sales.streak.is_active ? 'Ativo' : 'Inativo'}`;

  if (sales.active_goal) {
    section += `

**Meta de Vendas Ativa:**
- Contatos: ${sales.active_goal.contacts_current}/${sales.active_goal.contacts_target} (${sales.active_goal.progress_percent}%)
- Negócios: ${sales.active_goal.deals_current}/${sales.active_goal.deals_target}`;
  }

  section += `

**Gamificação:**
- Nível: ${sales.gamification.level}
- Pontos totais: ${sales.gamification.total_points}
- XP: ${sales.gamification.xp_current}/${sales.gamification.xp_to_next_level}`;

  if (sales.gamification.recent_achievements.length > 0) {
    section += `
- Conquistas recentes: ${sales.gamification.recent_achievements.join(', ')}`;
  }

  return section;
}
