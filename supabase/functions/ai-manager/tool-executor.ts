// Tool executor for AI Manager - ValtrixApp
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ToolName, ToolCallResult } from './tools.ts';

interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

export async function executeToolCall(
  supabase: SupabaseClient,
  userId: string,
  toolCall: ToolCall
): Promise<ToolCallResult> {
  const toolName = toolCall.function.name as ToolName;

  let args: Record<string, unknown>;
  try {
    args = JSON.parse(toolCall.function.arguments);
  } catch {
    return { success: false, error: 'Invalid tool arguments' };
  }

  try {
    switch (toolName) {
      // Ferramentas existentes
      case 'create_task':
        return await createTask(supabase, userId, args);
      case 'update_task_priority':
        return await updateTaskPriority(supabase, userId, args);
      case 'create_notification':
        return await createNotification(supabase, userId, args);
      case 'analyze_metrics':
        return await analyzeMetrics(supabase, userId, args);
      case 'create_insight':
        return await createInsight(supabase, userId, args);
      case 'get_tasks_summary':
        return await getTasksSummary(supabase, userId, args);
      case 'get_clients_summary':
        return await getClientsSummary(supabase, userId, args);
      case 'schedule_reminder':
        return await scheduleReminder(supabase, userId, args);

      // Ferramentas de Projetos
      case 'create_project':
        return await createProject(supabase, userId, args);
      case 'update_project':
        return await updateProject(supabase, userId, args);
      case 'get_projects_summary':
        return await getProjectsSummary(supabase, userId, args);
      case 'get_project_details':
        return await getProjectDetails(supabase, userId, args);
      case 'add_project_note':
        return await addProjectNote(supabase, userId, args);
      case 'get_project_tasks':
        return await getProjectTasks(supabase, userId, args);

      // Ferramentas de Calendário
      case 'get_upcoming_deadlines':
        return await getUpcomingDeadlines(supabase, userId, args);
      case 'get_daily_schedule':
        return await getDailySchedule(supabase, userId, args);
      case 'analyze_workload':
        return await analyzeWorkload(supabase, userId, args);
      case 'get_events_by_period':
        return await getEventsByPeriod(supabase, userId, args);

      // Ferramentas de Equipe
      case 'get_team_summary':
        return await getTeamSummary(supabase, userId, args);
      case 'get_team_member_details':
        return await getTeamMemberDetails(supabase, userId, args);
      case 'get_team_hierarchy':
        return await getTeamHierarchy(supabase, userId, args);
      case 'get_department_summary':
        return await getDepartmentSummary(supabase, userId, args);
      case 'analyze_team_productivity':
        return await analyzeTeamProductivity(supabase, userId, args);

      // Ferramentas de Pagamentos
      case 'get_payments_summary':
        return await getPaymentsSummary(supabase, userId, args);
      case 'get_pending_payments':
        return await getPendingPayments(supabase, userId, args);
      case 'record_payment':
        return await recordPayment(supabase, userId, args);
      case 'get_revenue_forecast':
        return await getRevenueForecast(supabase, userId, args);
      case 'analyze_payment_health':
        return await analyzePaymentHealth(supabase, userId, args);

      // Ferramentas de Metas
      case 'get_current_goals':
        return await getCurrentGoals(supabase, userId);
      case 'set_goal':
        return await setGoal(supabase, userId, args);
      case 'suggest_goals':
        return await suggestGoals(supabase, userId);
      case 'get_goal_insights':
        return await getGoalInsights(supabase, userId);

      // Ferramentas de Vendas/Comercial
      case 'get_sales_summary':
        return await getSalesSummary(supabase, userId, args);
      case 'log_sales_activity':
        return await logSalesActivity(supabase, userId, args);
      case 'get_sales_patterns':
        return await getSalesPatterns(supabase, userId, args);
      case 'create_sales_strategy':
        return await createSalesStrategy(supabase, userId, args);
      case 'get_sales_streak':
        return await getSalesStreak(supabase, userId, args);
      case 'suggest_daily_targets':
        return await suggestDailyTargets(supabase, userId, args);

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    console.error(`Tool execution error for ${toolName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function createTask(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      created_by: userId,
      title: args.title as string,
      description: args.description as string || null,
      priority: args.priority as string || 'medium',
      status: 'pending',
      due_date: args.due_date as string || null,
      project_id: args.project_id as string || null,
      assignee_id: args.assigned_to as string || null,
      estimated_hours: args.estimated_hours as number || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Handle tags if provided
  if (args.tags && Array.isArray(args.tags)) {
    for (const tagName of args.tags as string[]) {
      // Find or create tag
      const { data: existingTag } = await supabase
        .from('tags')
        .select('id')
        .eq('user_id', userId)
        .eq('name', tagName)
        .single();

      let tagId = existingTag?.id;

      if (!tagId) {
        const { data: newTag } = await supabase
          .from('tags')
          .insert({ user_id: userId, name: tagName, color: '#6366f1' })
          .select('id')
          .single();
        tagId = newTag?.id;
      }

      if (tagId) {
        await supabase
          .from('task_tags')
          .insert({ task_id: data.id, tag_id: tagId });
      }
    }
  }

  // Log AI action
  await logAIAction(supabase, userId, 'create_task', { task_id: data.id, title: args.title });

  return {
    success: true,
    data: {
      message: `Tarefa "${args.title}" criada com sucesso!`,
      task_id: data.id,
      task: data,
    },
  };
}

async function updateTaskPriority(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const taskIds = args.task_ids as string[];
  const newPriority = args.new_priority as string;
  const reason = args.reason as string;

  const { error } = await supabase
    .from('tasks')
    .update({ priority: newPriority })
    .in('id', taskIds)
    .eq('created_by', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Log AI action
  await logAIAction(supabase, userId, 'update_task_priority', {
    task_ids: taskIds,
    new_priority: newPriority,
    reason,
  });

  return {
    success: true,
    data: {
      message: `${taskIds.length} tarefa(s) atualizada(s) para prioridade ${newPriority}. Motivo: ${reason}`,
      updated_count: taskIds.length,
    },
  };
}

async function createNotification(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: args.title as string,
      message: args.message as string,
      type: args.type as string,
      priority: args.priority as string || 'medium',
      action_url: args.action_url as string || null,
      task_id: args.related_task_id as string || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Log AI action
  await logAIAction(supabase, userId, 'create_notification', {
    notification_id: data.id,
    type: args.type,
  });

  return {
    success: true,
    data: {
      message: `Notificação criada: "${args.title}"`,
      notification_id: data.id,
    },
  };
}

async function analyzeMetrics(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const metricType = args.metric_type as string;
  const period = args.period as string;
  const compareWithPrevious = args.compare_with_previous as boolean;

  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  // Calculate date range based on period
  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'this_week':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      break;
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'last_30_days':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'this_quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  let result: Record<string, unknown> = {};

  switch (metricType) {
    case 'mrr': {
      const { data: clients } = await supabase
        .from('clients')
        .select('monthly_value')
        .eq('created_by', userId)
        .eq('status', 'active');

      const totalMrr = clients?.reduce((sum, c) => sum + (c.monthly_value || 0), 0) || 0;
      result = {
        metric: 'MRR',
        value: totalMrr,
        formatted: `R$ ${totalMrr.toLocaleString('pt-BR')}`,
        period,
        clients_count: clients?.length || 0,
      };
      break;
    }
    case 'tasks_completed': {
      const { data: tasks, count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .eq('created_by', userId)
        .eq('status', 'completed')
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString());

      result = {
        metric: 'Tarefas Concluídas',
        value: count || 0,
        period,
        tasks: tasks?.slice(0, 5).map(t => ({ id: t.id, title: t.title })),
      };
      break;
    }
    case 'productivity': {
      const { count: completed } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', userId)
        .eq('status', 'completed')
        .gte('completed_at', startDate.toISOString());

      const { count: total } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', userId)
        .gte('created_at', startDate.toISOString());

      const rate = total && total > 0 ? ((completed || 0) / total) * 100 : 0;
      result = {
        metric: 'Produtividade',
        completed: completed || 0,
        created: total || 0,
        rate: Math.round(rate * 10) / 10,
        formatted: `${Math.round(rate)}%`,
        period,
      };
      break;
    }
    case 'overdue_tasks': {
      const today = new Date().toISOString().split('T')[0];
      const { data: overdueTasks, count } = await supabase
        .from('tasks')
        .select('id, title, due_date, priority, projects(clients(company_name))', { count: 'exact' })
        .eq('created_by', userId)
        .neq('status', 'completed')
        .lt('due_date', today);

      result = {
        metric: 'Tarefas Atrasadas',
        value: count || 0,
        tasks: overdueTasks?.map(t => ({
          id: t.id,
          title: t.title,
          due_date: t.due_date,
          priority: t.priority,
          client: (t.projects as { clients: { company_name: string } | null } | null)?.clients?.company_name,
        })),
      };
      break;
    }
    case 'client_growth': {
      const { count: currentClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', userId)
        .eq('status', 'active');

      const { count: newClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', userId)
        .gte('created_at', startDate.toISOString());

      result = {
        metric: 'Crescimento de Clientes',
        total_active: currentClients || 0,
        new_in_period: newClients || 0,
        period,
      };
      break;
    }
    case 'revenue_concentration': {
      const { data: clients } = await supabase
        .from('clients')
        .select('company_name, monthly_value')
        .eq('created_by', userId)
        .eq('status', 'active')
        .order('monthly_value', { ascending: false });

      const totalMrr = clients?.reduce((sum, c) => sum + (c.monthly_value || 0), 0) || 0;
      const top3Mrr = clients?.slice(0, 3).reduce((sum, c) => sum + (c.monthly_value || 0), 0) || 0;
      const concentration = totalMrr > 0 ? (top3Mrr / totalMrr) * 100 : 0;

      result = {
        metric: 'Concentração de Receita',
        total_mrr: totalMrr,
        top_3_mrr: top3Mrr,
        concentration_percent: Math.round(concentration * 10) / 10,
        top_clients: clients?.slice(0, 5).map(c => ({
          name: c.company_name,
          mrr: c.monthly_value,
          percentage: totalMrr > 0 ? Math.round(((c.monthly_value || 0) / totalMrr) * 1000) / 10 : 0,
        })),
        health: concentration > 60 ? 'risk' : concentration > 40 ? 'moderate' : 'healthy',
      };
      break;
    }
    default:
      return { success: false, error: `Unknown metric type: ${metricType}` };
  }

  return {
    success: true,
    data: result,
  };
}

async function createInsight(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const { data, error } = await supabase
    .from('ai_insights')
    .insert({
      user_id: userId,
      title: args.title as string,
      content: args.content as string,
      insight_type: args.insight_type as string,
      priority: args.priority as string,
      suggested_action: args.suggested_action as string || null,
      metric_impact: args.metric_impact as string || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Also create a notification for the insight
  await supabase.from('notifications').insert({
    user_id: userId,
    title: `Novo insight: ${args.title}`,
    message: args.content as string,
    type: 'ai_insight',
    priority: args.priority as string || 'medium',
  });

  return {
    success: true,
    data: {
      message: `Insight criado: "${args.title}"`,
      insight_id: data.id,
    },
  };
}

async function getTasksSummary(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const statusFilter = args.status_filter as string;
  const priorityFilter = args.priority_filter as string || 'all';
  const limit = args.limit as number || 20;

  let query = supabase
    .from('tasks')
    .select(`
      id,
      title,
      status,
      priority,
      due_date,
      description,
      projects(name, clients(company_name))
    `)
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  const today = new Date().toISOString().split('T')[0];

  switch (statusFilter) {
    case 'pending':
      query = query.eq('status', 'pending');
      break;
    case 'in_progress':
      query = query.eq('status', 'in_progress');
      break;
    case 'completed':
      query = query.eq('status', 'completed');
      break;
    case 'overdue':
      query = query.neq('status', 'completed').lt('due_date', today);
      break;
    // 'all' doesn't need a filter
  }

  if (priorityFilter !== 'all') {
    query = query.eq('priority', priorityFilter);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: {
      count: data?.length || 0,
      tasks: data?.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
        client: (t.projects as { name: string; clients: { company_name: string } | null } | null)?.clients?.company_name,
        project: (t.projects as { name: string } | null)?.name,
      })),
    },
  };
}

async function getClientsSummary(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const sortBy = args.sort_by as string;
  const limit = args.limit as number || 10;
  const includeMrr = args.include_mrr as boolean ?? true;

  const sortField = sortBy === 'tasks_count' ? 'created_at' : sortBy === 'mrr' ? 'monthly_value' : sortBy;

  const { data, error } = await supabase
    .from('clients')
    .select('id, company_name, email, status, monthly_value, created_at')
    .eq('created_by', userId)
    .eq('status', 'active')
    .order(sortField, { ascending: false })
    .limit(limit);

  if (error) {
    return { success: false, error: error.message };
  }

  let totalMrr = 0;
  if (includeMrr) {
    totalMrr = data?.reduce((sum, c) => sum + (c.monthly_value || 0), 0) || 0;
  }

  return {
    success: true,
    data: {
      count: data?.length || 0,
      total_mrr: includeMrr ? totalMrr : undefined,
      clients: data?.map(c => ({
        id: c.id,
        name: c.company_name,
        email: c.email,
        mrr: c.monthly_value || 0,
        created_at: c.created_at,
      })),
    },
  };
}

async function scheduleReminder(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  // For now, we'll create a notification scheduled for the future
  // In a real implementation, you'd use a job queue or scheduled function
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: 'Lembrete',
      message: args.message as string,
      type: 'task_reminder',
      priority: 'medium',
      task_id: args.related_task_id as string || null,
      // Note: scheduled_at would need to be added to the notifications table
      // For now, we create it immediately
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Log AI action
  await logAIAction(supabase, userId, 'schedule_reminder', {
    notification_id: data.id,
    remind_at: args.remind_at,
    message: args.message,
  });

  return {
    success: true,
    data: {
      message: `Lembrete agendado: "${args.message}"`,
      remind_at: args.remind_at,
      notification_id: data.id,
    },
  };
}

async function logAIAction(
  supabase: SupabaseClient,
  userId: string,
  actionType: string,
  params: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from('ai_actions').insert({
      user_id: userId,
      action_type: actionType,
      parameters: params,
      status: 'completed',
    });
  } catch (error) {
    console.error('Failed to log AI action:', error);
  }
}

// ========== FERRAMENTAS DE PROJETOS ==========

async function createProject(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      created_by: userId,
      name: args.name as string,
      description: args.description as string || null,
      client_id: args.client_id as string || null,
      start_date: args.start_date as string || new Date().toISOString().split('T')[0],
      end_date: args.end_date as string || null,
      budget: args.budget as number || null,
      status: args.status as string || 'planning',
      priority: args.priority as string || 'medium',
    })
    .select(`*, clients(company_name)`)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await logAIAction(supabase, userId, 'create_project', { project_id: data.id, name: args.name });

  return {
    success: true,
    data: {
      message: `Projeto "${args.name}" criado com sucesso!`,
      project_id: data.id,
      project: {
        id: data.id,
        name: data.name,
        status: data.status,
        client: (data.clients as { company_name: string } | null)?.company_name,
        start_date: data.start_date,
        end_date: data.end_date,
        budget: data.budget,
      },
    },
  };
}

async function updateProject(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const projectId = args.project_id as string;
  const updateData: Record<string, unknown> = {};

  if (args.name) updateData.name = args.name;
  if (args.description !== undefined) updateData.description = args.description;
  if (args.status) updateData.status = args.status;
  if (args.end_date) updateData.end_date = args.end_date;
  if (args.budget !== undefined) updateData.budget = args.budget;
  if (args.priority) updateData.priority = args.priority;

  const { data, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', projectId)
    .eq('created_by', userId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await logAIAction(supabase, userId, 'update_project', { project_id: projectId, updates: updateData });

  return {
    success: true,
    data: {
      message: `Projeto atualizado com sucesso!`,
      project: data,
    },
  };
}

async function getProjectsSummary(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const statusFilter = args.status_filter as string || 'all';
  const clientId = args.client_id as string;
  const sortBy = args.sort_by as string || 'created_at';
  const limit = args.limit as number || 20;

  let query = supabase
    .from('projects')
    .select(`
      id, name, description, status, priority,
      start_date, end_date, budget, created_at,
      clients(id, company_name),
      tasks(id)
    `)
    .eq('created_by', userId)
    .order(sortBy, { ascending: sortBy === 'name' })
    .limit(limit);

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }
  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  const projects = data?.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    priority: p.priority,
    client: (p.clients as { id: string; company_name: string } | null)?.company_name,
    start_date: p.start_date,
    end_date: p.end_date,
    budget: p.budget,
    tasks_count: Array.isArray(p.tasks) ? p.tasks.length : 0,
  }));

  return {
    success: true,
    data: {
      count: projects?.length || 0,
      projects,
      total_budget: projects?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0,
    },
  };
}

async function getProjectDetails(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const projectId = args.project_id as string;
  const includeTasks = args.include_tasks as boolean ?? true;
  const includeNotes = args.include_notes as boolean ?? true;

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      clients(id, company_name, email)
    `)
    .eq('id', projectId)
    .eq('created_by', userId)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  let tasks = [];
  let notes = [];

  if (includeTasks) {
    const { data: taskData } = await supabase
      .from('tasks')
      .select('id, title, status, priority, due_date, assigned_to')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    tasks = taskData || [];
  }

  if (includeNotes) {
    const { data: noteData } = await supabase
      .from('project_notes')
      .select('id, content, note_type, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    notes = noteData || [];
  }

  return {
    success: true,
    data: {
      project: {
        ...project,
        client: project.clients,
      },
      tasks: includeTasks ? tasks : undefined,
      notes: includeNotes ? notes : undefined,
      stats: {
        total_tasks: tasks.length,
        completed_tasks: tasks.filter((t: { status: string }) => t.status === 'completed').length,
        pending_tasks: tasks.filter((t: { status: string }) => t.status === 'pending').length,
      },
    },
  };
}

async function addProjectNote(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const { data, error } = await supabase
    .from('project_notes')
    .insert({
      project_id: args.project_id as string,
      user_id: userId,
      content: args.content as string,
      note_type: args.note_type as string || 'general',
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await logAIAction(supabase, userId, 'add_project_note', {
    project_id: args.project_id,
    note_id: data.id,
  });

  return {
    success: true,
    data: {
      message: 'Nota adicionada ao projeto com sucesso!',
      note: data,
    },
  };
}

async function getProjectTasks(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const projectId = args.project_id as string;
  const statusFilter = args.status_filter as string || 'all';

  let query = supabase
    .from('tasks')
    .select(`
      id, title, description, status, priority,
      due_date, estimated_hours, assignee_id,
      created_at, completed_at
    `)
    .eq('project_id', projectId)
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: {
      count: data?.length || 0,
      tasks: data,
      by_status: {
        pending: data?.filter(t => t.status === 'pending').length || 0,
        in_progress: data?.filter(t => t.status === 'in_progress').length || 0,
        completed: data?.filter(t => t.status === 'completed').length || 0,
      },
    },
  };
}

// ========== FERRAMENTAS DE CALENDÁRIO ==========

async function getUpcomingDeadlines(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const daysAhead = args.days_ahead as number || 7;
  const types = args.types as string[] || ['task', 'project', 'payment'];
  const priorityFilter = args.priority_filter as string || 'all';

  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  const futureDateStr = futureDate.toISOString().split('T')[0];

  const deadlines: Array<{
    type: string;
    id: string;
    title: string;
    date: string;
    priority?: string;
    client_name?: string;
    amount?: number;
  }> = [];

  if (types.includes('task')) {
    let taskQuery = supabase
      .from('tasks')
      .select('id, title, due_date, priority, projects(clients(company_name))')
      .eq('created_by', userId)
      .neq('status', 'completed')
      .gte('due_date', today)
      .lte('due_date', futureDateStr);

    if (priorityFilter !== 'all') {
      taskQuery = taskQuery.in('priority', priorityFilter === 'urgent' ? ['urgent'] : ['high', 'urgent']);
    }

    const { data: tasks } = await taskQuery;
    tasks?.forEach(t => {
      deadlines.push({
        type: 'task',
        id: t.id,
        title: t.title,
        date: t.due_date,
        priority: t.priority,
        client_name: (t.projects as { clients: { company_name: string } | null } | null)?.clients?.company_name,
      });
    });
  }

  if (types.includes('project')) {
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, end_date, priority, clients(company_name)')
      .eq('created_by', userId)
      .neq('status', 'completed')
      .gte('end_date', today)
      .lte('end_date', futureDateStr);

    projects?.forEach(p => {
      deadlines.push({
        type: 'project',
        id: p.id,
        title: p.name,
        date: p.end_date,
        priority: p.priority,
        client_name: (p.clients as { company_name: string } | null)?.company_name,
      });
    });
  }

  if (types.includes('payment')) {
    // Payments are linked to clients, get all pending payments from user's clients
    const { data: userClients } = await supabase
      .from('clients')
      .select('id')
      .eq('created_by', userId);

    const clientIds = userClients?.map(c => c.id) || [];

    const { data: payments } = await supabase
      .from('payments')
      .select('id, description, due_date, amount, clients(company_name)')
      .in('client_id', clientIds)
      .eq('status', 'pending')
      .gte('due_date', today)
      .lte('due_date', futureDateStr);

    payments?.forEach(p => {
      deadlines.push({
        type: 'payment',
        id: p.id,
        title: p.description || 'Pagamento',
        date: p.due_date,
        amount: p.amount,
        client_name: (p.clients as { company_name: string } | null)?.company_name,
      });
    });
  }

  // Sort by date
  deadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    success: true,
    data: {
      count: deadlines.length,
      days_ahead: daysAhead,
      deadlines,
    },
  };
}

async function getDailySchedule(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const date = args.date as string || new Date().toISOString().split('T')[0];
  const includeTasks = args.include_tasks as boolean ?? true;
  const includePayments = args.include_payments as boolean ?? true;

  const schedule: Array<{
    type: string;
    id: string;
    title: string;
    priority?: string;
    amount?: number;
    client_name?: string;
  }> = [];

  if (includeTasks) {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, priority, status, projects(clients(company_name))')
      .eq('created_by', userId)
      .eq('due_date', date)
      .neq('status', 'completed');

    tasks?.forEach(t => {
      schedule.push({
        type: 'task',
        id: t.id,
        title: t.title,
        priority: t.priority,
        client_name: (t.projects as { clients: { company_name: string } | null } | null)?.clients?.company_name,
      });
    });
  }

  if (includePayments) {
    // Get payments from user's clients
    const { data: userClients } = await supabase
      .from('clients')
      .select('id')
      .eq('created_by', userId);

    const clientIds = userClients?.map(c => c.id) || [];

    const { data: payments } = await supabase
      .from('payments')
      .select('id, description, amount, clients(company_name)')
      .in('client_id', clientIds)
      .eq('due_date', date)
      .eq('status', 'pending');

    payments?.forEach(p => {
      schedule.push({
        type: 'payment',
        id: p.id,
        title: p.description || 'Pagamento a receber',
        amount: p.amount,
        client_name: (p.clients as { company_name: string } | null)?.company_name,
      });
    });
  }

  return {
    success: true,
    data: {
      date,
      total_items: schedule.length,
      schedule,
      summary: {
        tasks: schedule.filter(s => s.type === 'task').length,
        payments: schedule.filter(s => s.type === 'payment').length,
        total_receivable: schedule
          .filter(s => s.type === 'payment')
          .reduce((sum, s) => sum + (s.amount || 0), 0),
      },
    },
  };
}

async function analyzeWorkload(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const period = args.period as string;
  const groupBy = args.group_by as string || 'day';

  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case 'this_week':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      break;
    case 'next_week':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 7);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      break;
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'next_month':
      startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
  }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, due_date, priority, estimated_hours, status, assignee_id')
    .eq('created_by', userId)
    .neq('status', 'completed')
    .gte('due_date', startDate.toISOString().split('T')[0])
    .lte('due_date', endDate.toISOString().split('T')[0]);

  const totalTasks = tasks?.length || 0;
  const totalHours = tasks?.reduce((sum, t) => sum + (t.estimated_hours || 2), 0) || 0;
  const urgentTasks = tasks?.filter(t => t.priority === 'urgent' || t.priority === 'high').length || 0;

  let workloadAnalysis: Record<string, unknown> = {};

  if (groupBy === 'day') {
    const byDay: Record<string, number> = {};
    tasks?.forEach(t => {
      const day = t.due_date;
      byDay[day] = (byDay[day] || 0) + 1;
    });
    workloadAnalysis = { by_day: byDay };
  } else if (groupBy === 'project') {
    const { data: projectTasks } = await supabase
      .from('tasks')
      .select('project_id, projects(name)')
      .eq('created_by', userId)
      .neq('status', 'completed')
      .gte('due_date', startDate.toISOString().split('T')[0])
      .lte('due_date', endDate.toISOString().split('T')[0]);

    const byProject: Record<string, number> = {};
    projectTasks?.forEach(t => {
      const projectName = (t.projects as { name: string } | null)?.name || 'Sem projeto';
      byProject[projectName] = (byProject[projectName] || 0) + 1;
    });
    workloadAnalysis = { by_project: byProject };
  }

  return {
    success: true,
    data: {
      period,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      summary: {
        total_tasks: totalTasks,
        estimated_hours: totalHours,
        urgent_high_priority: urgentTasks,
        avg_tasks_per_day: Math.round((totalTasks / 7) * 10) / 10,
      },
      ...workloadAnalysis,
      recommendation: totalHours > 40
        ? 'Carga de trabalho alta! Considere redistribuir ou repriorizar tarefas.'
        : totalHours > 25
        ? 'Carga moderada. Atenção aos prazos urgentes.'
        : 'Carga de trabalho equilibrada.',
    },
  };
}

async function getEventsByPeriod(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const startDate = args.start_date as string;
  const endDate = args.end_date as string;

  // Buscar tarefas com vencimento no período
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, due_date, priority, status')
    .eq('created_by', userId)
    .gte('due_date', startDate)
    .lte('due_date', endDate);

  // Buscar projetos com término no período
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, end_date, status')
    .eq('created_by', userId)
    .gte('end_date', startDate)
    .lte('end_date', endDate);

  // Buscar pagamentos no período (from user's clients)
  const { data: userClients } = await supabase
    .from('clients')
    .select('id')
    .eq('created_by', userId);

  const clientIds = userClients?.map(c => c.id) || [];

  const { data: payments } = await supabase
    .from('payments')
    .select('id, description, due_date, amount, status')
    .in('client_id', clientIds)
    .gte('due_date', startDate)
    .lte('due_date', endDate);

  const events = [
    ...(tasks?.map(t => ({
      type: 'task',
      id: t.id,
      title: t.title,
      date: t.due_date,
      priority: t.priority,
      status: t.status,
    })) || []),
    ...(projects?.map(p => ({
      type: 'project_deadline',
      id: p.id,
      title: p.name,
      date: p.end_date,
      status: p.status,
    })) || []),
    ...(payments?.map(p => ({
      type: 'payment',
      id: p.id,
      title: p.description || 'Pagamento',
      date: p.due_date,
      amount: p.amount,
      status: p.status,
    })) || []),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    success: true,
    data: {
      period: { start: startDate, end: endDate },
      total_events: events.length,
      events,
      by_type: {
        tasks: tasks?.length || 0,
        projects: projects?.length || 0,
        payments: payments?.length || 0,
      },
    },
  };
}

// ========== FERRAMENTAS DE EQUIPE ==========

async function getTeamSummary(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const includeSalaries = args.include_salaries as boolean ?? false;
  const departmentFilter = args.department_filter as string;
  const statusFilter = args.status_filter as string || 'all';

  // Note: team_members doesn't have created_by - RLS handles filtering
  let query = supabase
    .from('team_members')
    .select('id, role, department, status, hire_date, salary, manager_id, user_id, users:user_id(full_name, email)');

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }
  if (departmentFilter) {
    query = query.eq('department', departmentFilter);
  }

  const { data: members, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  const byDepartment: Record<string, number> = {};
  const byRole: Record<string, number> = {};
  let totalSalary = 0;

  members?.forEach(m => {
    const dept = m.department || 'Sem departamento';
    const role = m.role || 'Sem cargo';
    byDepartment[dept] = (byDepartment[dept] || 0) + 1;
    byRole[role] = (byRole[role] || 0) + 1;
    if (includeSalaries) {
      totalSalary += m.salary || 0;
    }
  });

  return {
    success: true,
    data: {
      total_members: members?.length || 0,
      active: members?.filter(m => m.status === 'active').length || 0,
      by_department: byDepartment,
      by_role: byRole,
      members: members?.map(m => ({
        id: m.id,
        name: (m.users as { full_name: string; email: string } | null)?.full_name || 'Sem nome',
        email: (m.users as { full_name: string; email: string } | null)?.email,
        role: m.role,
        department: m.department,
        status: m.status,
        hire_date: m.hire_date,
        salary: includeSalaries ? m.salary : undefined,
      })),
      financials: includeSalaries ? {
        total_monthly_salary: totalSalary,
        avg_salary: members?.length ? Math.round(totalSalary / members.length) : 0,
      } : undefined,
    },
  };
}

async function getTeamMemberDetails(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const memberId = args.member_id as string;
  const includeTasks = args.include_tasks as boolean ?? true;
  const includeProjects = args.include_projects as boolean ?? true;
  const includeSalary = args.include_salary as boolean ?? false;
  const includePerformance = args.include_performance as boolean ?? false;

  const { data: member, error } = await supabase
    .from('team_members')
    .select('*, users:user_id(full_name, email)')
    .eq('id', memberId)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  let tasks = [];
  let projects = [];
  let performance = {};

  if (includeTasks) {
    const { data: taskData } = await supabase
      .from('tasks')
      .select('id, title, status, priority, due_date')
      .eq('assigned_to', memberId)
      .neq('status', 'completed')
      .limit(20);
    tasks = taskData || [];
  }

  if (includeProjects) {
    const { data: projectData } = await supabase
      .from('projects')
      .select('id, name, status')
      .contains('team_members', [memberId])
      .neq('status', 'completed')
      .limit(10);
    projects = projectData || [];
  }

  if (includePerformance) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);

    const { count: completedThisMonth } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', memberId)
      .eq('status', 'completed')
      .gte('completed_at', startOfMonth.toISOString());

    const { count: totalAssigned } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', memberId)
      .gte('created_at', startOfMonth.toISOString());

    performance = {
      tasks_completed_this_month: completedThisMonth || 0,
      tasks_assigned_this_month: totalAssigned || 0,
      completion_rate: totalAssigned && totalAssigned > 0
        ? Math.round(((completedThisMonth || 0) / totalAssigned) * 100)
        : 0,
    };
  }

  return {
    success: true,
    data: {
      member: {
        id: member.id,
        name: (member.users as { full_name: string; email: string } | null)?.full_name || 'Sem nome',
        email: (member.users as { full_name: string; email: string } | null)?.email,
        role: member.role,
        department: member.department,
        status: member.status,
        hire_date: member.hire_date,
        manager_id: member.manager_id,
        salary: includeSalary ? member.salary : undefined,
      },
      tasks: includeTasks ? tasks : undefined,
      projects: includeProjects ? projects : undefined,
      performance: includePerformance ? performance : undefined,
    },
  };
}

async function getTeamHierarchy(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const departmentFilter = args.department as string;

  let query = supabase
    .from('team_members')
    .select('id, role, department, manager_id, status, users:user_id(full_name)')
    .eq('status', 'active');

  if (departmentFilter) {
    query = query.eq('department', departmentFilter);
  }

  const { data: members, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  // Build hierarchy
  const hierarchy: Record<string, unknown>[] = [];
  const memberMap = new Map(members?.map(m => [m.id, {
    ...m,
    name: (m.users as { full_name: string } | null)?.full_name || 'Sem nome',
    subordinates: [] as unknown[]
  }]));

  members?.forEach(m => {
    const member = memberMap.get(m.id);
    if (m.manager_id && memberMap.has(m.manager_id)) {
      const manager = memberMap.get(m.manager_id);
      (manager as { subordinates: unknown[] }).subordinates.push(member);
    } else {
      hierarchy.push(member as Record<string, unknown>);
    }
  });

  return {
    success: true,
    data: {
      total_members: members?.length || 0,
      hierarchy,
      departments: [...new Set(members?.map(m => m.department).filter(Boolean))],
    },
  };
}

async function getDepartmentSummary(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const department = args.department as string;
  const includeBudget = args.include_budget as boolean ?? false;
  const includeProjects = args.include_projects as boolean ?? false;

  const { data: members, error } = await supabase
    .from('team_members')
    .select('id, role, status, salary, users:user_id(full_name)')
    .eq('department', department);

  if (error) {
    return { success: false, error: error.message };
  }

  let projects = [];
  if (includeProjects) {
    // Get projects where department members are involved
    const memberIds = members?.map(m => m.id) || [];
    const { data: projectData } = await supabase
      .from('tasks')
      .select('project_id, projects(id, name, status)')
      .in('assigned_to', memberIds)
      .not('project_id', 'is', null);

    const uniqueProjects = new Map();
    projectData?.forEach(t => {
      const proj = t.projects as { id: string; name: string; status: string } | null;
      if (proj && !uniqueProjects.has(proj.id)) {
        uniqueProjects.set(proj.id, proj);
      }
    });
    projects = Array.from(uniqueProjects.values());
  }

  const totalSalary = includeBudget
    ? members?.reduce((sum, m) => sum + (m.salary || 0), 0) || 0
    : undefined;

  return {
    success: true,
    data: {
      department,
      total_members: members?.length || 0,
      active_members: members?.filter(m => m.status === 'active').length || 0,
      members: members?.map(m => ({
        id: m.id,
        name: (m.users as { full_name: string } | null)?.full_name || 'Sem nome',
        role: m.role,
        status: m.status,
      })),
      budget: includeBudget ? {
        total_monthly_salary: totalSalary,
      } : undefined,
      projects: includeProjects ? projects : undefined,
    },
  };
}

async function analyzeTeamProductivity(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const period = args.period as string;
  const groupBy = args.group_by as string || 'member';
  const memberId = args.member_id as string;

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'this_week':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      break;
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      break;
    case 'this_quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // Get team members
  let membersQuery = supabase
    .from('team_members')
    .select('id, department, users:user_id(full_name)')
    .eq('status', 'active');

  if (memberId) {
    membersQuery = membersQuery.eq('id', memberId);
  }

  const { data: members } = await membersQuery;

  // Get completed tasks by assignee
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, assignee_id, completed_at, status')
    .eq('created_by', userId)
    .in('assignee_id', members?.map(m => m.id) || [])
    .gte('created_at', startDate.toISOString());

  const productivity: Record<string, unknown>[] = [];

  if (groupBy === 'member') {
    members?.forEach(member => {
      const memberTasks = tasks?.filter(t => t.assignee_id === member.id) || [];
      const completed = memberTasks.filter(t => t.status === 'completed').length;
      const total = memberTasks.length;

      productivity.push({
        member_id: member.id,
        member_name: (member.users as { full_name: string } | null)?.full_name || 'Sem nome',
        department: member.department,
        tasks_completed: completed,
        tasks_total: total,
        completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      });
    });
  } else if (groupBy === 'department') {
    const byDept: Record<string, { completed: number; total: number }> = {};
    members?.forEach(member => {
      const dept = member.department || 'Sem departamento';
      if (!byDept[dept]) byDept[dept] = { completed: 0, total: 0 };

      const memberTasks = tasks?.filter(t => t.assignee_id === member.id) || [];
      byDept[dept].completed += memberTasks.filter(t => t.status === 'completed').length;
      byDept[dept].total += memberTasks.length;
    });

    Object.entries(byDept).forEach(([dept, stats]) => {
      productivity.push({
        department: dept,
        tasks_completed: stats.completed,
        tasks_total: stats.total,
        completion_rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      });
    });
  }

  // Sort by completion rate descending
  productivity.sort((a, b) => (b.completion_rate as number) - (a.completion_rate as number));

  return {
    success: true,
    data: {
      period,
      start_date: startDate.toISOString().split('T')[0],
      group_by: groupBy,
      productivity,
      summary: {
        total_tasks: tasks?.length || 0,
        completed_tasks: tasks?.filter(t => t.status === 'completed').length || 0,
        overall_completion_rate: tasks?.length
          ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
          : 0,
      },
    },
  };
}

// ========== FERRAMENTAS DE PAGAMENTOS ==========

async function getPaymentsSummary(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const period = args.period as string || 'this_month';
  const clientId = args.client_id as string;
  const includeForecast = args.include_forecast as boolean ?? false;

  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  switch (period) {
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'this_quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
      break;
    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  // Get user's clients first
  const { data: userClients } = await supabase
    .from('clients')
    .select('id')
    .eq('created_by', userId);

  const userClientIds = userClients?.map(c => c.id) || [];

  let query = supabase
    .from('payments')
    .select('id, amount, status, due_date, paid_date, clients(company_name)')
    .in('client_id', userClientIds)
    .gte('due_date', startDate.toISOString().split('T')[0])
    .lte('due_date', endDate.toISOString().split('T')[0]);

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data: payments, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  const today = new Date().toISOString().split('T')[0];
  const received = payments?.filter(p => p.status === 'paid') || [];
  const pending = payments?.filter(p => p.status === 'pending') || [];
  const overdue = pending.filter(p => p.due_date < today);

  const receivedAmount = received.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingAmount = pending.reduce((sum, p) => sum + (p.amount || 0), 0);
  const overdueAmount = overdue.reduce((sum, p) => sum + (p.amount || 0), 0);

  let forecast = undefined;
  if (includeForecast) {
    // Simple forecast based on MRR
    const { data: clients } = await supabase
      .from('clients')
      .select('monthly_value')
      .eq('created_by', userId)
      .eq('status', 'active');

    const totalMrr = clients?.reduce((sum, c) => sum + (c.monthly_value || 0), 0) || 0;
    forecast = {
      next_month_projected: totalMrr,
      based_on: 'MRR de clientes ativos',
    };
  }

  return {
    success: true,
    data: {
      period,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      summary: {
        total_payments: payments?.length || 0,
        received_count: received.length,
        received_amount: receivedAmount,
        pending_count: pending.length,
        pending_amount: pendingAmount,
        overdue_count: overdue.length,
        overdue_amount: overdueAmount,
      },
      forecast,
    },
  };
}

async function getPendingPayments(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const statusFilter = args.status_filter as string || 'all';
  const clientId = args.client_id as string;
  const sortBy = args.sort_by as string || 'due_date';
  const limit = args.limit as number || 50;

  const today = new Date().toISOString().split('T')[0];

  // Get user's clients first
  const { data: userClients } = await supabase
    .from('clients')
    .select('id')
    .eq('created_by', userId);

  const userClientIds = userClients?.map(c => c.id) || [];

  let query = supabase
    .from('payments')
    .select('id, description, amount, due_date, status, clients(id, company_name, email)')
    .in('client_id', userClientIds)
    .eq('status', 'pending')
    .limit(limit);

  if (statusFilter === 'overdue') {
    query = query.lt('due_date', today);
  }
  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const sortField = sortBy === 'days_overdue' ? 'due_date' : sortBy === 'client_name' ? 'due_date' : sortBy;
  const { data: payments, error } = await query.order(sortField, { ascending: sortBy === 'due_date' });

  if (error) {
    return { success: false, error: error.message };
  }

  const paymentsWithDetails = payments?.map(p => {
    const dueDate = new Date(p.due_date);
    const todayDate = new Date(today);
    const daysOverdue = p.due_date < today
      ? Math.floor((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const client = p.clients as { id: string; company_name: string; email: string } | null;
    return {
      id: p.id,
      description: p.description,
      amount: p.amount,
      due_date: p.due_date,
      is_overdue: p.due_date < today,
      days_overdue: daysOverdue,
      client: client ? { id: client.id, name: client.company_name, email: client.email } : null,
    };
  }) || [];

  if (sortBy === 'days_overdue') {
    paymentsWithDetails.sort((a, b) => b.days_overdue - a.days_overdue);
  }

  const totalPending = paymentsWithDetails.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalOverdue = paymentsWithDetails
    .filter(p => p.is_overdue)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return {
    success: true,
    data: {
      count: paymentsWithDetails.length,
      total_pending: totalPending,
      total_overdue: totalOverdue,
      payments: paymentsWithDetails,
    },
  };
}

async function recordPayment(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const paymentId = args.payment_id as string;
  const paidDate = args.paid_date as string || new Date().toISOString().split('T')[0];
  const amountPaid = args.amount_paid as number;
  const paymentMethod = args.payment_method as string;
  const notes = args.notes as string;

  const updateData: Record<string, unknown> = {
    status: 'paid',
    paid_date: paidDate,
  };

  if (amountPaid !== undefined) updateData.amount_paid = amountPaid;
  if (paymentMethod) updateData.payment_method = paymentMethod;
  if (notes) updateData.notes = notes;

  // Verify payment belongs to user's client
  const { data: payment } = await supabase
    .from('payments')
    .select('client_id')
    .eq('id', paymentId)
    .single();

  if (payment) {
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('id', payment.client_id)
      .eq('created_by', userId)
      .single();

    if (!client) {
      return { success: false, error: 'Pagamento não encontrado' };
    }
  }

  const { data, error } = await supabase
    .from('payments')
    .update(updateData)
    .eq('id', paymentId)
    .select('*, clients(company_name)')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await logAIAction(supabase, userId, 'record_payment', {
    payment_id: paymentId,
    amount: data.amount,
    paid_date: paidDate,
  });

  return {
    success: true,
    data: {
      message: `Pagamento de R$ ${data.amount?.toLocaleString('pt-BR')} registrado com sucesso!`,
      payment: {
        id: data.id,
        amount: data.amount,
        paid_date: data.paid_date,
        client: (data.clients as { company_name: string } | null)?.company_name,
      },
    },
  };
}

async function getRevenueForecast(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const monthsAhead = Math.min(args.months_ahead as number || 3, 12);
  const includeMrr = args.include_mrr as boolean ?? true;
  const includeProjects = args.include_projects as boolean ?? true;
  const scenario = args.scenario as string || 'moderate';

  // Get MRR from active clients
  let totalMrr = 0;
  if (includeMrr) {
    const { data: clients } = await supabase
      .from('clients')
      .select('monthly_value')
      .eq('created_by', userId)
      .eq('status', 'active');

    totalMrr = clients?.reduce((sum, c) => sum + (c.monthly_value || 0), 0) || 0;
  }

  // Get project-based revenue
  let projectRevenue = 0;
  if (includeProjects) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + monthsAhead);

    const { data: projects } = await supabase
      .from('projects')
      .select('budget, end_date')
      .eq('created_by', userId)
      .eq('status', 'active')
      .lte('end_date', futureDate.toISOString().split('T')[0]);

    projectRevenue = projects?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0;
  }

  // Apply scenario multiplier
  const scenarioMultiplier = scenario === 'conservative' ? 0.85 : scenario === 'optimistic' ? 1.15 : 1;

  const forecast: Array<{
    month: string;
    mrr: number;
    projects: number;
    total: number;
  }> = [];

  for (let i = 1; i <= monthsAhead; i++) {
    const month = new Date();
    month.setMonth(month.getMonth() + i);

    forecast.push({
      month: month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      mrr: Math.round(totalMrr * scenarioMultiplier),
      projects: Math.round((projectRevenue / monthsAhead) * scenarioMultiplier),
      total: Math.round((totalMrr + projectRevenue / monthsAhead) * scenarioMultiplier),
    });
  }

  const totalForecast = forecast.reduce((sum, f) => sum + f.total, 0);

  return {
    success: true,
    data: {
      scenario,
      months_ahead: monthsAhead,
      current_mrr: totalMrr,
      forecast,
      total_projected: totalForecast,
      assumptions: {
        mrr_growth: scenario === 'optimistic' ? '+15%' : scenario === 'conservative' ? '-15%' : '0%',
        churn_adjustment: scenario === 'conservative' ? 'Considerado 15% de churn' : 'Sem ajuste de churn',
      },
    },
  };
}

async function analyzePaymentHealth(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const period = args.period as string;
  const clientId = args.client_id as string;

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'last_3_months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      break;
    case 'last_6_months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      break;
    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  }

  // Get user's clients first
  const { data: userClients } = await supabase
    .from('clients')
    .select('id')
    .eq('created_by', userId);

  const userClientIds = userClients?.map(c => c.id) || [];

  let query = supabase
    .from('payments')
    .select('id, amount, status, due_date, paid_date, clients(id, company_name)')
    .in('client_id', userClientIds)
    .gte('due_date', startDate.toISOString().split('T')[0]);

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data: payments, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  const today = new Date().toISOString().split('T')[0];
  const totalPayments = payments?.length || 0;
  const paidPayments = payments?.filter(p => p.status === 'paid') || [];
  const overduePayments = payments?.filter(p => p.status === 'pending' && p.due_date < today) || [];

  // Calculate average days to pay
  let totalDaysToPay = 0;
  let countWithDates = 0;
  paidPayments.forEach(p => {
    if (p.paid_date && p.due_date) {
      const dueDate = new Date(p.due_date);
      const paidDate = new Date(p.paid_date);
      totalDaysToPay += (paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);
      countWithDates++;
    }
  });
  const avgDaysToPay = countWithDates > 0 ? Math.round(totalDaysToPay / countWithDates) : 0;

  // Default rate
  const totalAmount = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const overdueAmount = overduePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const defaultRate = totalAmount > 0 ? Math.round((overdueAmount / totalAmount) * 100) : 0;

  // Collection efficiency
  const paidAmount = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const expectedAmount = payments
    ?.filter(p => p.due_date <= today)
    .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const collectionEfficiency = expectedAmount > 0
    ? Math.round((paidAmount / expectedAmount) * 100)
    : 100;

  // Identify at-risk clients
  const clientOverdue: Record<string, { name: string; count: number; amount: number }> = {};
  overduePayments.forEach(p => {
    const client = p.clients as { id: string; company_name: string } | null;
    if (client) {
      if (!clientOverdue[client.id]) {
        clientOverdue[client.id] = { name: client.company_name, count: 0, amount: 0 };
      }
      clientOverdue[client.id].count++;
      clientOverdue[client.id].amount += p.amount || 0;
    }
  });

  const atRiskClients = Object.values(clientOverdue)
    .filter(c => c.count >= 2)
    .sort((a, b) => b.amount - a.amount);

  return {
    success: true,
    data: {
      period,
      start_date: startDate.toISOString().split('T')[0],
      metrics: {
        total_payments: totalPayments,
        paid_count: paidPayments.length,
        overdue_count: overduePayments.length,
        default_rate: `${defaultRate}%`,
        avg_days_to_pay: avgDaysToPay,
        collection_efficiency: `${collectionEfficiency}%`,
      },
      amounts: {
        total: totalAmount,
        paid: paidAmount,
        overdue: overdueAmount,
      },
      at_risk_clients: atRiskClients.slice(0, 5),
      health_score: collectionEfficiency >= 90
        ? 'Excelente'
        : collectionEfficiency >= 75
        ? 'Bom'
        : collectionEfficiency >= 50
        ? 'Atenção necessária'
        : 'Crítico',
      recommendations: defaultRate > 20
        ? ['Revisar política de crédito', 'Implementar lembretes automáticos', 'Considerar antecipação de recebíveis']
        : defaultRate > 10
        ? ['Acompanhar clientes com atraso', 'Enviar lembretes antes do vencimento']
        : ['Manter práticas atuais de cobrança'],
    },
  };
}

// ========== FERRAMENTAS DE METAS ==========

async function getCurrentGoals(
  supabase: SupabaseClient,
  userId: string
): Promise<ToolCallResult> {
  // Chama a função PostgreSQL que atualiza e retorna as metas
  const { data, error } = await supabase.rpc('get_current_goals', {
    p_user_id: userId
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data || data.length === 0) {
    return {
      success: true,
      data: {
        has_goals: false,
        message: 'Você ainda não definiu metas para este mês. Gostaria que eu sugerisse algumas metas baseadas no seu histórico?',
      },
    };
  }

  const goal = data[0];
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const expectedProgress = (dayOfMonth / daysInMonth) * 100;

  return {
    success: true,
    data: {
      has_goals: true,
      is_confirmed: goal.is_confirmed,
      month: goal.month,
      metrics: {
        mrr: {
          target: goal.mrr_target,
          current: goal.mrr_current,
          progress: goal.mrr_progress,
          status: getGoalStatus(goal.mrr_progress, expectedProgress),
        },
        clients: {
          target: goal.clients_target,
          current: goal.clients_current,
          progress: goal.clients_progress,
          status: getGoalStatus(goal.clients_progress, expectedProgress),
        },
        tasks: {
          target: goal.tasks_target,
          current: goal.tasks_current,
          progress: goal.tasks_progress,
          status: getGoalStatus(goal.tasks_progress, expectedProgress),
        },
        projects: {
          target: goal.projects_target,
          current: goal.projects_current,
          progress: goal.projects_progress,
          status: getGoalStatus(goal.projects_progress, expectedProgress),
        },
      },
      day_of_month: dayOfMonth,
      days_in_month: daysInMonth,
      expected_progress: Math.round(expectedProgress),
    },
  };
}

function getGoalStatus(progress: number, expectedProgress: number): string {
  if (progress >= 100) return 'achieved';
  if (progress >= expectedProgress * 0.9) return 'ahead';
  if (progress >= expectedProgress * 0.5) return 'on_track';
  return 'behind';
}

async function setGoal(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const metric = args.metric as string;
  const target = args.target as number;
  const confirm = args.confirm as boolean || false;

  const now = new Date();
  const month = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  // Mapear métrica para coluna
  const metricColumn = `${metric}_target`;

  // Verificar se já existe meta para o mês
  const { data: existingGoal } = await supabase
    .from('goals')
    .select('id')
    .eq('user_id', userId)
    .eq('month', month)
    .single();

  let result;
  if (existingGoal) {
    // Atualizar meta existente
    const updateData: Record<string, unknown> = {
      [metricColumn]: target,
    };
    if (confirm) {
      updateData.is_confirmed = true;
    }

    result = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', existingGoal.id)
      .select()
      .single();
  } else {
    // Criar nova meta
    const insertData: Record<string, unknown> = {
      user_id: userId,
      month: month,
      [metricColumn]: target,
      is_confirmed: confirm,
    };

    result = await supabase
      .from('goals')
      .insert(insertData)
      .select()
      .single();
  }

  if (result.error) {
    return { success: false, error: result.error.message };
  }

  const metricNames: Record<string, string> = {
    mrr: 'MRR',
    clients: 'Novos Clientes',
    tasks: 'Tarefas Concluídas',
    projects: 'Projetos Entregues',
  };

  await logAIAction(supabase, userId, 'set_goal', {
    metric,
    target,
    confirmed: confirm,
  });

  return {
    success: true,
    data: {
      message: `Meta de ${metricNames[metric]} definida: ${metric === 'mrr' ? 'R$ ' : ''}${target.toLocaleString('pt-BR')}${confirm ? '. Metas confirmadas!' : ''}`,
      goal: result.data,
    },
  };
}

async function suggestGoals(
  supabase: SupabaseClient,
  userId: string
): Promise<ToolCallResult> {
  // Chama a função PostgreSQL que sugere metas
  const { data, error } = await supabase.rpc('suggest_goals_for_user', {
    p_user_id: userId
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data || data.length === 0) {
    return {
      success: true,
      data: {
        message: 'Não foi possível gerar sugestões. Usando valores padrão.',
        suggestions: {
          mrr: 1000,
          clients: 2,
          tasks: 20,
          projects: 1,
        },
      },
    };
  }

  const suggestion = data[0];

  // Salvar sugestões na tabela goals
  const now = new Date();
  const month = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  await supabase
    .from('goals')
    .upsert({
      user_id: userId,
      month: month,
      mrr_suggested: suggestion.mrr_suggested,
      clients_suggested: suggestion.clients_suggested,
      tasks_suggested: suggestion.tasks_suggested,
      projects_suggested: suggestion.projects_suggested,
    }, { onConflict: 'user_id,month' });

  return {
    success: true,
    data: {
      message: 'Sugestões de metas geradas com base no seu histórico (10% de crescimento):',
      suggestions: {
        mrr: {
          value: suggestion.mrr_suggested,
          formatted: `R$ ${Number(suggestion.mrr_suggested).toLocaleString('pt-BR')}`,
        },
        clients: {
          value: suggestion.clients_suggested,
          formatted: `${suggestion.clients_suggested} novos clientes`,
        },
        tasks: {
          value: suggestion.tasks_suggested,
          formatted: `${suggestion.tasks_suggested} tarefas concluídas`,
        },
        projects: {
          value: suggestion.projects_suggested,
          formatted: `${suggestion.projects_suggested} projetos entregues`,
        },
      },
      hint: 'Use "definir meta de [métrica] para [valor]" para aceitar ou ajustar as sugestões.',
    },
  };
}

async function getGoalInsights(
  supabase: SupabaseClient,
  userId: string
): Promise<ToolCallResult> {
  // Chama a função PostgreSQL que gera insights
  const { data, error } = await supabase.rpc('generate_goal_insights', {
    p_user_id: userId
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data || data.length === 0) {
    return {
      success: true,
      data: {
        insights: [],
        message: 'Nenhum insight disponível no momento.',
      },
    };
  }

  const insights = data.map((insight: {
    insight_type: string;
    metric: string;
    message: string;
    priority: number;
  }) => ({
    type: insight.insight_type,
    metric: insight.metric,
    message: insight.message,
    priority: insight.priority,
  }));

  // Ordenar por prioridade (menor número = maior prioridade)
  insights.sort((a: { priority: number }, b: { priority: number }) => a.priority - b.priority);

  return {
    success: true,
    data: {
      insights,
      main_message: insights[0]?.message || 'Você está no caminho certo!',
    },
  };
}

// ========== FERRAMENTAS DE VENDAS/COMERCIAL ==========

async function getSalesSummary(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const periodDays = (args.period_days as number) || 30;
  const includeFunnel = args.include_funnel as boolean ?? true;
  const includeByService = args.include_by_service as boolean ?? true;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  // Buscar atividades do período
  const { data: activities, error } = await supabase
    .from('sales_daily_activities')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  // Calcular totais
  const totals = (activities || []).reduce(
    (acc, a) => ({
      contacts: acc.contacts + (a.contacts_sent || 0),
      calls: acc.calls + (a.calls_made || 0),
      meetings: acc.meetings + (a.meetings_held || 0),
      proposals: acc.proposals + (a.proposals_sent || 0),
      leads: acc.leads + (a.leads_qualified || 0),
      deals: acc.deals + (a.deals_closed || 0),
      revenue: acc.revenue + (a.revenue_generated || 0),
    }),
    { contacts: 0, calls: 0, meetings: 0, proposals: 0, leads: 0, deals: 0, revenue: 0 }
  );

  const daysWithActivity = activities?.length || 1;

  // Calcular médias
  const averages = {
    contacts_per_day: Math.round(totals.contacts / daysWithActivity),
    calls_per_day: Math.round(totals.calls / daysWithActivity),
    meetings_per_day: Math.round((totals.meetings / daysWithActivity) * 10) / 10,
    conversion_rate: totals.contacts > 0
      ? Math.round((totals.deals / totals.contacts) * 100 * 100) / 100
      : 0,
  };

  // Dados do funil
  let funnel = undefined;
  if (includeFunnel) {
    funnel = [
      { stage: 'Contatos', count: totals.contacts, color: '#3B82F6' },
      { stage: 'Qualificados', count: totals.leads, conversion: totals.contacts > 0 ? Math.round((totals.leads / totals.contacts) * 100) : 0, color: '#8B5CF6' },
      { stage: 'Reuniões', count: totals.meetings, conversion: totals.leads > 0 ? Math.round((totals.meetings / totals.leads) * 100) : 0, color: '#F59E0B' },
      { stage: 'Propostas', count: totals.proposals, conversion: totals.meetings > 0 ? Math.round((totals.proposals / totals.meetings) * 100) : 0, color: '#F97316' },
      { stage: 'Fechados', count: totals.deals, conversion: totals.proposals > 0 ? Math.round((totals.deals / totals.proposals) * 100) : 0, color: '#10B981' },
    ];
  }

  // Por serviço
  let byService = undefined;
  if (includeByService) {
    byService = (activities || []).reduce(
      (acc, a) => ({
        automation: acc.automation + (a.service_automation || 0),
        traffic: acc.traffic + (a.service_traffic || 0),
        sites: acc.sites + (a.service_sites || 0),
        bugs: acc.bugs + (a.service_bugs || 0),
      }),
      { automation: 0, traffic: 0, sites: 0, bugs: 0 }
    );
  }

  // Atividade de hoje
  const today = new Date().toISOString().split('T')[0];
  const todayActivity = activities?.find(a => a.date === today);

  return {
    success: true,
    data: {
      period: `${periodDays} dias`,
      days_with_activity: daysWithActivity,
      totals,
      averages,
      funnel,
      by_service: byService,
      today: todayActivity ? {
        contacts: todayActivity.contacts_sent || 0,
        calls: todayActivity.calls_made || 0,
        meetings: todayActivity.meetings_held || 0,
        deals: todayActivity.deals_closed || 0,
      } : null,
    },
  };
}

async function logSalesActivity(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const today = new Date().toISOString().split('T')[0];

  // Buscar atividade existente de hoje
  const { data: existing } = await supabase
    .from('sales_daily_activities')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  // Preparar dados para upsert
  const updateData: Record<string, unknown> = {
    user_id: userId,
    date: today,
    updated_at: new Date().toISOString(),
  };

  if (args.contacts_sent !== undefined) {
    updateData.contacts_sent = (existing?.contacts_sent || 0) + (args.contacts_sent as number);
  }
  if (args.calls_made !== undefined) {
    updateData.calls_made = (existing?.calls_made || 0) + (args.calls_made as number);
  }
  if (args.meetings_held !== undefined) {
    updateData.meetings_held = (existing?.meetings_held || 0) + (args.meetings_held as number);
  }
  if (args.proposals_sent !== undefined) {
    updateData.proposals_sent = (existing?.proposals_sent || 0) + (args.proposals_sent as number);
  }
  if (args.leads_qualified !== undefined) {
    updateData.leads_qualified = (existing?.leads_qualified || 0) + (args.leads_qualified as number);
  }
  if (args.deals_closed !== undefined) {
    updateData.deals_closed = (existing?.deals_closed || 0) + (args.deals_closed as number);
  }
  if (args.revenue_generated !== undefined) {
    updateData.revenue_generated = (existing?.revenue_generated || 0) + (args.revenue_generated as number);
  }
  if (args.notes) {
    updateData.notes = args.notes as string;
  }

  // Atualizar por serviço se informado
  if (args.service_type && args.deals_closed) {
    const serviceField = `service_${args.service_type}`;
    updateData[serviceField] = (existing?.[serviceField] || 0) + (args.deals_closed as number);
  }

  const { data, error } = await supabase
    .from('sales_daily_activities')
    .upsert(updateData, { onConflict: 'user_id,date' })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Atualizar streak de prospecção se teve atividade relevante
  if (args.contacts_sent || args.calls_made || args.meetings_held) {
    await updateSalesStreak(supabase, userId, 'daily_prospecting', today);
  }

  await logAIAction(supabase, userId, 'log_sales_activity', {
    date: today,
    activities: args,
  });

  // Calcular mensagem de feedback
  const activityList: string[] = [];
  if (args.contacts_sent) activityList.push(`${args.contacts_sent} contatos`);
  if (args.calls_made) activityList.push(`${args.calls_made} ligações`);
  if (args.meetings_held) activityList.push(`${args.meetings_held} reuniões`);
  if (args.proposals_sent) activityList.push(`${args.proposals_sent} propostas`);
  if (args.deals_closed) activityList.push(`${args.deals_closed} negócios fechados`);

  return {
    success: true,
    data: {
      message: `Atividades registradas: ${activityList.join(', ')}! 🎯`,
      today_totals: {
        contacts: data.contacts_sent || 0,
        calls: data.calls_made || 0,
        meetings: data.meetings_held || 0,
        proposals: data.proposals_sent || 0,
        deals: data.deals_closed || 0,
        revenue: data.revenue_generated || 0,
      },
    },
  };
}

async function updateSalesStreak(
  supabase: SupabaseClient,
  userId: string,
  streakType: string,
  date: string
): Promise<void> {
  const { data: existing } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .eq('streak_type', streakType)
    .single();

  if (!existing) {
    await supabase
      .from('user_streaks')
      .insert({
        user_id: userId,
        streak_type: streakType,
        current_count: 1,
        longest_count: 1,
        last_activity_date: date,
      });
    return;
  }

  const lastDate = new Date(existing.last_activity_date || date);
  const currentDate = new Date(date);
  const diffTime = currentDate.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let newCount = existing.current_count;
  if (diffDays === 1) {
    newCount = existing.current_count + 1;
  } else if (diffDays > 1) {
    newCount = 1;
  }

  if (diffDays >= 0) {
    await supabase
      .from('user_streaks')
      .update({
        current_count: newCount,
        longest_count: Math.max(existing.longest_count, newCount),
        last_activity_date: date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  }
}

async function getSalesPatterns(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const periodDays = (args.period_days as number) || 30;
  const analysisType = (args.analysis_type as string) || 'conversion';

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  const { data: activities, error } = await supabase
    .from('sales_daily_activities')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  let analysis: Record<string, unknown> = {};

  switch (analysisType) {
    case 'conversion': {
      const totals = (activities || []).reduce(
        (acc, a) => ({
          contacts: acc.contacts + (a.contacts_sent || 0),
          leads: acc.leads + (a.leads_qualified || 0),
          meetings: acc.meetings + (a.meetings_held || 0),
          proposals: acc.proposals + (a.proposals_sent || 0),
          deals: acc.deals + (a.deals_closed || 0),
        }),
        { contacts: 0, leads: 0, meetings: 0, proposals: 0, deals: 0 }
      );

      analysis = {
        type: 'conversion',
        rates: {
          contact_to_lead: totals.contacts > 0 ? Math.round((totals.leads / totals.contacts) * 100) : 0,
          lead_to_meeting: totals.leads > 0 ? Math.round((totals.meetings / totals.leads) * 100) : 0,
          meeting_to_proposal: totals.meetings > 0 ? Math.round((totals.proposals / totals.meetings) * 100) : 0,
          proposal_to_deal: totals.proposals > 0 ? Math.round((totals.deals / totals.proposals) * 100) : 0,
          overall: totals.contacts > 0 ? Math.round((totals.deals / totals.contacts) * 100 * 10) / 10 : 0,
        },
        insights: [],
      };

      // Gerar insights
      const rates = analysis.rates as Record<string, number>;
      const insights: string[] = [];
      if (rates.contact_to_lead < 30) {
        insights.push('Taxa de qualificação baixa. Considere melhorar o script de abordagem inicial.');
      }
      if (rates.meeting_to_proposal < 50) {
        insights.push('Muitas reuniões não resultam em propostas. Revise a qualificação pré-reunião.');
      }
      if (rates.proposal_to_deal < 30) {
        insights.push('Fechamento precisa de atenção. Considere técnicas de follow-up mais efetivas.');
      }
      if (rates.overall > 5) {
        insights.push('Sua taxa de conversão geral está acima da média! Continue assim.');
      }
      analysis.insights = insights;
      break;
    }
    case 'volume': {
      // Análise por dia da semana
      const byDayOfWeek: Record<string, { contacts: number; deals: number; count: number }> = {};
      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

      (activities || []).forEach(a => {
        const dayOfWeek = dayNames[new Date(a.date).getDay()];
        if (!byDayOfWeek[dayOfWeek]) {
          byDayOfWeek[dayOfWeek] = { contacts: 0, deals: 0, count: 0 };
        }
        byDayOfWeek[dayOfWeek].contacts += a.contacts_sent || 0;
        byDayOfWeek[dayOfWeek].deals += a.deals_closed || 0;
        byDayOfWeek[dayOfWeek].count++;
      });

      // Encontrar melhor dia
      let bestDay = '';
      let bestAvg = 0;
      Object.entries(byDayOfWeek).forEach(([day, data]) => {
        const avg = data.count > 0 ? data.contacts / data.count : 0;
        if (avg > bestAvg) {
          bestAvg = avg;
          bestDay = day;
        }
      });

      analysis = {
        type: 'volume',
        by_day_of_week: byDayOfWeek,
        best_day: bestDay,
        recommendation: bestDay ? `Seu melhor dia é ${bestDay}. Considere intensificar prospecção neste dia.` : 'Dados insuficientes para análise.',
      };
      break;
    }
    case 'service_mix': {
      const byService = (activities || []).reduce(
        (acc, a) => ({
          automation: acc.automation + (a.service_automation || 0),
          traffic: acc.traffic + (a.service_traffic || 0),
          sites: acc.sites + (a.service_sites || 0),
          bugs: acc.bugs + (a.service_bugs || 0),
        }),
        { automation: 0, traffic: 0, sites: 0, bugs: 0 }
      );

      const total = byService.automation + byService.traffic + byService.sites + byService.bugs;

      analysis = {
        type: 'service_mix',
        by_service: byService,
        percentages: {
          automation: total > 0 ? Math.round((byService.automation / total) * 100) : 0,
          traffic: total > 0 ? Math.round((byService.traffic / total) * 100) : 0,
          sites: total > 0 ? Math.round((byService.sites / total) * 100) : 0,
          bugs: total > 0 ? Math.round((byService.bugs / total) * 100) : 0,
        },
        recommendation: 'Diversifique sua oferta de serviços para reduzir dependência.',
      };
      break;
    }
    default:
      analysis = { type: 'unknown', message: 'Tipo de análise não reconhecido.' };
  }

  return {
    success: true,
    data: {
      period: `${periodDays} dias`,
      analysis,
    },
  };
}

async function createSalesStrategy(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const { data, error } = await supabase
    .from('sales_strategies')
    .insert({
      user_id: userId,
      title: args.title as string,
      description: args.description as string,
      action_items: args.action_items as string[],
      based_on_analysis: args.based_on_analysis as string || null,
      expected_impact: args.expected_impact as string || null,
      status: 'suggested',
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await logAIAction(supabase, userId, 'create_sales_strategy', {
    strategy_id: data.id,
    title: args.title,
  });

  return {
    success: true,
    data: {
      message: `Estratégia "${args.title}" criada com sucesso! 📈`,
      strategy: {
        id: data.id,
        title: data.title,
        description: data.description,
        action_items: data.action_items,
        expected_impact: data.expected_impact,
        status: data.status,
      },
    },
  };
}

async function getSalesStreak(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const streakType = (args.streak_type as string) || 'daily_prospecting';

  const { data: streak, error } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .eq('streak_type', streakType)
    .single();

  if (error && error.code !== 'PGRST116') {
    return { success: false, error: error.message };
  }

  if (!streak) {
    return {
      success: true,
      data: {
        has_streak: false,
        message: 'Você ainda não iniciou um streak de prospecção. Comece hoje! 🚀',
        current_count: 0,
        longest_count: 0,
      },
    };
  }

  // Verificar se streak ainda está ativo (última atividade foi ontem ou hoje)
  const today = new Date().toISOString().split('T')[0];
  const lastActivity = streak.last_activity_date;
  const lastDate = new Date(lastActivity);
  const todayDate = new Date(today);
  const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  const isActive = diffDays <= 1;
  const streakMilestones = [3, 7, 14, 30, 60, 90, 180, 365];
  const nextMilestone = streakMilestones.find(m => m > streak.current_count) || null;

  let motivationalMessage = '';
  if (!isActive) {
    motivationalMessage = `Seu streak foi interrompido após ${streak.current_count} dias. Comece um novo hoje! 💪`;
  } else if (streak.current_count >= 30) {
    motivationalMessage = `Incrível! ${streak.current_count} dias consecutivos! Você é uma máquina de vendas! 🔥`;
  } else if (streak.current_count >= 7) {
    motivationalMessage = `Uma semana de prospecção consistente! Continue assim! 🌟`;
  } else if (streak.current_count >= 3) {
    motivationalMessage = `${streak.current_count} dias seguidos! O hábito está se formando! 💫`;
  } else {
    motivationalMessage = `${streak.current_count} dia(s) de streak. Mantenha o ritmo! 🎯`;
  }

  return {
    success: true,
    data: {
      has_streak: true,
      is_active: isActive,
      current_count: isActive ? streak.current_count : 0,
      longest_count: streak.longest_count,
      last_activity_date: streak.last_activity_date,
      next_milestone: nextMilestone,
      days_to_milestone: nextMilestone ? nextMilestone - streak.current_count : null,
      message: motivationalMessage,
    },
  };
}

async function suggestDailyTargets(
  supabase: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
): Promise<ToolCallResult> {
  const basedOnGoal = args.based_on_goal as boolean ?? true;

  // Buscar média dos últimos 30 dias
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const { data: activities } = await supabase
    .from('sales_daily_activities')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0]);

  const daysWithActivity = activities?.length || 1;
  const totals = (activities || []).reduce(
    (acc, a) => ({
      contacts: acc.contacts + (a.contacts_sent || 0),
      calls: acc.calls + (a.calls_made || 0),
      meetings: acc.meetings + (a.meetings_held || 0),
    }),
    { contacts: 0, calls: 0, meetings: 0 }
  );

  // Média histórica
  const avgContacts = Math.round(totals.contacts / daysWithActivity);
  const avgCalls = Math.round(totals.calls / daysWithActivity);
  const avgMeetings = Math.round((totals.meetings / daysWithActivity) * 10) / 10;

  // Buscar meta ativa se houver
  let goalMultiplier = 1.1; // 10% acima da média como padrão
  if (basedOnGoal) {
    const today = new Date().toISOString().split('T')[0];
    const { data: activeGoal } = await supabase
      .from('sales_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .lte('start_date', today)
      .gte('end_date', today)
      .single();

    if (activeGoal) {
      // Calcular dias restantes no período
      const endGoalDate = new Date(activeGoal.end_date);
      const todayDate = new Date(today);
      const daysRemaining = Math.max(1, Math.ceil((endGoalDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)));

      // Ajustar multiplicador baseado na meta
      if (activeGoal.contacts_target) {
        const remainingContacts = activeGoal.contacts_target - (totals.contacts || 0);
        const neededPerDay = remainingContacts / daysRemaining;
        goalMultiplier = avgContacts > 0 ? neededPerDay / avgContacts : 1.2;
      }
    }
  }

  // Sugerir metas com base no multiplicador
  const suggestedContacts = Math.max(5, Math.round(avgContacts * goalMultiplier));
  const suggestedCalls = Math.max(3, Math.round(avgCalls * goalMultiplier));
  const suggestedMeetings = Math.max(1, Math.round(avgMeetings * goalMultiplier));

  return {
    success: true,
    data: {
      suggested_targets: {
        contacts: suggestedContacts,
        calls: suggestedCalls,
        meetings: suggestedMeetings,
      },
      based_on: {
        historical_average: {
          contacts: avgContacts,
          calls: avgCalls,
          meetings: avgMeetings,
        },
        multiplier: Math.round(goalMultiplier * 100) / 100,
      },
      message: `Metas sugeridas para hoje: ${suggestedContacts} contatos, ${suggestedCalls} ligações, ${suggestedMeetings} reunião(ões). Vamos lá! 🎯`,
    },
  };
}
