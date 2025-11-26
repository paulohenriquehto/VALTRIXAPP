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
      user_id: userId,
      title: args.title as string,
      description: args.description as string || null,
      priority: args.priority as string || 'medium',
      status: 'pending',
      due_date: args.due_date as string || null,
      project_id: args.project_id as string || null,
      client_id: args.client_id as string || null,
      assigned_to: args.assigned_to as string || userId,
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
    .eq('user_id', userId);

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
        .select('mrr')
        .eq('user_id', userId)
        .eq('status', 'active');

      const totalMrr = clients?.reduce((sum, c) => sum + (c.mrr || 0), 0) || 0;
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
        .eq('user_id', userId)
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
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', startDate.toISOString());

      const { count: total } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
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
        .select('id, title, due_date, priority, clients(name)', { count: 'exact' })
        .eq('user_id', userId)
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
          client: (t.clients as { name: string } | null)?.name,
        })),
      };
      break;
    }
    case 'client_growth': {
      const { count: currentClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active');

      const { count: newClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
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
        .select('name, mrr')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('mrr', { ascending: false });

      const totalMrr = clients?.reduce((sum, c) => sum + (c.mrr || 0), 0) || 0;
      const top3Mrr = clients?.slice(0, 3).reduce((sum, c) => sum + (c.mrr || 0), 0) || 0;
      const concentration = totalMrr > 0 ? (top3Mrr / totalMrr) * 100 : 0;

      result = {
        metric: 'Concentração de Receita',
        total_mrr: totalMrr,
        top_3_mrr: top3Mrr,
        concentration_percent: Math.round(concentration * 10) / 10,
        top_clients: clients?.slice(0, 5).map(c => ({
          name: c.name,
          mrr: c.mrr,
          percentage: totalMrr > 0 ? Math.round(((c.mrr || 0) / totalMrr) * 1000) / 10 : 0,
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
      clients(name),
      projects(name)
    `)
    .eq('user_id', userId)
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
        client: (t.clients as { name: string } | null)?.name,
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

  const sortField = sortBy === 'tasks_count' ? 'created_at' : sortBy;

  const { data, error } = await supabase
    .from('clients')
    .select('id, name, email, status, mrr, created_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order(sortField, { ascending: false })
    .limit(limit);

  if (error) {
    return { success: false, error: error.message };
  }

  let totalMrr = 0;
  if (includeMrr) {
    totalMrr = data?.reduce((sum, c) => sum + (c.mrr || 0), 0) || 0;
  }

  return {
    success: true,
    data: {
      count: data?.length || 0,
      total_mrr: includeMrr ? totalMrr : undefined,
      clients: data?.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        mrr: c.mrr || 0,
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
