// Context aggregation for AI Manager - ValtrixApp
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AggregatedContext {
  user: UserContext;
  tasks: TasksContext;
  clients: ClientsContext;
  financial: FinancialContext;
  productivity: ProductivityContext;
  timestamp: string;
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

export async function aggregateContext(
  supabase: SupabaseClient,
  userId: string
): Promise<AggregatedContext> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Fetch user data
  const { data: userData } = await supabase
    .from('profiles')
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
      clients(name),
      projects(name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // Fetch clients with MRR calculation
  const { data: clients } = await supabase
    .from('clients')
    .select(`
      id,
      name,
      status,
      mrr,
      created_at
    `)
    .eq('user_id', userId)
    .eq('status', 'active');

  // Calculate task metrics
  const taskMetrics = calculateTaskMetrics(tasks || [], startOfDay, startOfWeek);

  // Calculate client metrics
  const clientMetrics = calculateClientMetrics(clients || [], startOfMonth);

  // Calculate financial metrics
  const financialMetrics = calculateFinancialMetrics(clients || []);

  // Calculate productivity metrics
  const productivityMetrics = calculateProductivityMetrics(tasks || [], startOfDay, startOfWeek);

  return {
    user: {
      id: userId,
      name: userData?.full_name || null,
      email: userData?.email || '',
    },
    tasks: taskMetrics,
    clients: clientMetrics,
    financial: financialMetrics,
    productivity: productivityMetrics,
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
    clients: { name: string } | null;
    projects: { name: string } | null;
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
    client_name: t.clients?.name || null,
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
    name: string;
    status: string;
    mrr: number | null;
    created_at: string;
  }>,
  startOfMonth: string
): ClientsContext {
  const activeClients = clients.filter((c) => c.status === 'active');
  const newThisMonth = clients.filter((c) => c.created_at >= startOfMonth).length;

  // Sort by MRR and get top clients
  const sortedByMrr = [...activeClients].sort((a, b) => (b.mrr || 0) - (a.mrr || 0));
  const topClients = sortedByMrr.slice(0, 5).map((c) => ({
    id: c.id,
    name: c.name,
    mrr: c.mrr || 0,
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
    name: string;
    mrr: number | null;
  }>
): FinancialContext {
  const totalMrr = clients.reduce((sum, c) => sum + (c.mrr || 0), 0);
  const avgClientValue = clients.length > 0 ? totalMrr / clients.length : 0;

  // Calculate revenue concentration (top 3 clients)
  const sortedByMrr = [...clients].sort((a, b) => (b.mrr || 0) - (a.mrr || 0));
  const top3Mrr = sortedByMrr.slice(0, 3).reduce((sum, c) => sum + (c.mrr || 0), 0);
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

export function formatContextForPrompt(context: AggregatedContext): string {
  const { user, tasks, clients, financial, productivity } = context;

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
${tasks.recent_tasks.slice(0, 5).map((t) => `- [${t.priority.toUpperCase()}] ${t.title} (${t.status})${t.client_name ? ` - ${t.client_name}` : ''}`).join('\n')}`;
}
