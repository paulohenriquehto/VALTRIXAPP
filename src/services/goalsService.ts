import { supabase } from '../lib/supabase';
import type {
  MonthlyGoals,
  Goal,
  GoalProgress,
  GoalInsight,
  GoalSuggestions,
  GoalStatus,
  GoalStatusType,
  GoalPeriodType,
  GoalInput,
  GoalFilters,
  GoalDayInfo,
} from '../types/goals';
import { PERIOD_TYPE_LABELS } from '../types/goals';

export class GoalsService {
  /**
   * Get current month's goals for a user
   */
  static async getCurrentGoals(userId: string): Promise<MonthlyGoals | null> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('month', monthStart)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * Create or update goals for current month
   */
  static async saveGoals(
    userId: string,
    goals: Partial<MonthlyGoals>
  ): Promise<MonthlyGoals> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];

    const { data, error } = await supabase
      .from('goals')
      .upsert(
        {
          user_id: userId,
          month: monthStart,
          ...goals,
        },
        { onConflict: 'user_id,month' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Confirm goals (starts tracking)
   */
  static async confirmGoals(userId: string): Promise<MonthlyGoals> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];

    const { data, error } = await supabase
      .from('goals')
      .update({ is_confirmed: true })
      .eq('user_id', userId)
      .eq('month', monthStart)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get AI suggested goals based on history
   */
  static async getAISuggestions(userId: string): Promise<GoalSuggestions> {
    const { data, error } = await supabase.rpc('suggest_goals_for_user', {
      p_user_id: userId,
    });

    if (error) throw error;

    if (!data || data.length === 0) {
      // Default suggestions
      return {
        mrr: 1000,
        clients: 2,
        tasks: 20,
        projects: 1,
      };
    }

    const suggestion = data[0];
    return {
      mrr: suggestion.mrr_suggested,
      clients: suggestion.clients_suggested,
      tasks: suggestion.tasks_suggested,
      projects: suggestion.projects_suggested,
    };
  }

  /**
   * Get goal insights from database
   */
  static async getGoalInsights(userId: string): Promise<GoalInsight[]> {
    const { data, error } = await supabase.rpc('generate_goal_insights', {
      p_user_id: userId,
    });

    if (error) throw error;

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(
      (insight: {
        insight_type: string;
        metric: string;
        message: string;
        priority: number;
      }) => ({
        type: insight.insight_type as GoalInsight['type'],
        metric: insight.metric,
        message: insight.message,
        priority: insight.priority,
      })
    );
  }

  /**
   * Update progress for all goals (triggers database function)
   */
  static async updateProgress(userId: string): Promise<void> {
    const { error } = await supabase.rpc('update_goal_progress', {
      p_user_id: userId,
    });

    if (error) throw error;
  }

  /**
   * Calculate goal progress from raw data
   */
  static calculateProgress(goals: MonthlyGoals | null): GoalProgress[] {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    const expectedProgress = (dayOfMonth / daysInMonth) * 100;

    if (!goals) {
      return [];
    }

    const getStatus = (progress: number): GoalStatus => {
      if (progress >= 100) return 'achieved';
      if (progress >= expectedProgress * 0.9) return 'ahead';
      if (progress >= expectedProgress * 0.5) return 'on_track';
      return 'behind';
    };

    const calcProgress = (current: number, target: number): number => {
      if (target <= 0) return 0;
      return Math.round((current / target) * 100 * 10) / 10;
    };

    const metrics: Array<{
      key: 'mrr' | 'clients' | 'tasks' | 'projects';
      label: string;
      unit: string;
      prefix?: string;
    }> = [
      { key: 'mrr', label: 'MRR', unit: '', prefix: 'R$' },
      { key: 'clients', label: 'Novos Clientes', unit: 'clientes' },
      { key: 'tasks', label: 'Tarefas Concluídas', unit: 'tarefas' },
      { key: 'projects', label: 'Projetos Entregues', unit: 'projetos' },
    ];

    return metrics.map((m) => {
      const target = goals[`${m.key}_target` as keyof MonthlyGoals] as number;
      const current = goals[`${m.key}_current` as keyof MonthlyGoals] as number;
      const progress = calcProgress(current, target);

      return {
        metric: m.key,
        label: m.label,
        target,
        current,
        progress,
        status: getStatus(progress),
        unit: m.unit,
        prefix: m.prefix,
      };
    });
  }

  /**
   * Get expected progress percentage for current day
   */
  static getExpectedProgress(): number {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    return Math.round((dayOfMonth / daysInMonth) * 100);
  }

  /**
   * Get current day info
   */
  static getDayInfo(): { dayOfMonth: number; daysInMonth: number } {
    const now = new Date();
    return {
      dayOfMonth: now.getDate(),
      daysInMonth: new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).getDate(),
    };
  }

  /**
   * Format value for display
   */
  static formatValue(
    value: number,
    metric: 'mrr' | 'clients' | 'tasks' | 'projects'
  ): string {
    if (metric === 'mrr') {
      return `R$ ${value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return value.toString();
  }

  // ============================================
  // NOVOS METODOS PARA PERIODOS CUSTOMIZAVEIS
  // ============================================

  /**
   * Get all active goals for a user (end_date >= today)
   */
  static async getActiveGoals(userId: string): Promise<Goal[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .gte('end_date', today)
      .order('end_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get all goals for a user with optional filters
   */
  static async getAllGoals(userId: string, filters?: GoalFilters): Promise<Goal[]> {
    let query = supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    if (filters?.period_type) {
      query = query.eq('period_type', filters.period_type);
    }

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.dateRange) {
      query = query
        .gte('start_date', filters.dateRange.start)
        .lte('end_date', filters.dateRange.end);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Get goals by status category
   */
  static async getGoalsByStatus(
    userId: string,
    status: 'active' | 'draft' | 'completed'
  ): Promise<Goal[]> {
    return this.getAllGoals(userId, { status });
  }

  /**
   * Create a new goal with period
   */
  static async createGoal(userId: string, input: GoalInput): Promise<Goal> {
    const title = input.title || this.generateTitle(input.period_type, input.start_date, input.end_date);

    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: userId,
        period_type: input.period_type,
        start_date: input.start_date,
        end_date: input.end_date,
        title,
        month: input.start_date, // Legacy compatibility
        mrr_target: input.mrr_target,
        clients_target: input.clients_target,
        tasks_target: input.tasks_target,
        projects_target: input.projects_target,
        mrr_current: 0,
        clients_current: 0,
        tasks_current: 0,
        projects_current: 0,
        is_confirmed: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing goal
   */
  static async updateGoal(
    goalId: string,
    userId: string,
    updates: Partial<GoalInput>
  ): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Confirm a goal by ID (sets status to 'active')
   */
  static async confirmGoalById(goalId: string, userId: string): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .update({
        is_confirmed: true,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a goal
   */
  static async deleteGoal(goalId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Generate automatic title for a goal
   */
  static generateTitle(
    periodType: GoalPeriodType,
    startDate: string,
    endDate: string
  ): string {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    switch (periodType) {
      case 'monthly':
        return `Meta de ${monthNames[start.getMonth()]}`;
      case 'quarterly': {
        const quarter = Math.floor(start.getMonth() / 3) + 1;
        return `Meta Q${quarter} ${start.getFullYear()}`;
      }
      case 'weekly':
        return `Sprint Semanal - ${start.getDate()}/${start.getMonth() + 1}`;
      case 'biweekly':
        return `Sprint Quinzenal - ${start.getDate()}/${start.getMonth() + 1}`;
      case 'custom': {
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return `Meta ${diffDays} dias - vence ${end.getDate()}/${end.getMonth() + 1}`;
      }
      default:
        return `Meta ${PERIOD_TYPE_LABELS[periodType]}`;
    }
  }

  /**
   * Get default dates for a period type
   */
  static getDefaultDates(periodType: GoalPeriodType): { start: string; end: string } {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    switch (periodType) {
      case 'weekly': {
        const end = new Date(now);
        end.setDate(end.getDate() + 6);
        return { start: today, end: end.toISOString().split('T')[0] };
      }
      case 'biweekly': {
        const end = new Date(now);
        end.setDate(end.getDate() + 13);
        return { start: today, end: end.toISOString().split('T')[0] };
      }
      case 'monthly': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          start: monthStart.toISOString().split('T')[0],
          end: monthEnd.toISOString().split('T')[0],
        };
      }
      case 'quarterly': {
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
        return {
          start: quarterStart.toISOString().split('T')[0],
          end: quarterEnd.toISOString().split('T')[0],
        };
      }
      case 'custom':
      default: {
        const end = new Date(now);
        end.setDate(end.getDate() + 14);
        return { start: today, end: end.toISOString().split('T')[0] };
      }
    }
  }

  /**
   * Check if a goal is currently active
   */
  static isGoalActive(goal: Goal): boolean {
    return goal.status === 'active';
  }

  /**
   * Check if a goal has been completed
   */
  static isGoalCompleted(goal: Goal): boolean {
    return goal.status === 'completed';
  }

  /**
   * Check if a goal has expired (past end_date without completion)
   */
  static isGoalExpired(goal: Goal): boolean {
    return goal.status === 'expired';
  }

  /**
   * Check if a goal is a draft
   */
  static isGoalDraft(goal: Goal): boolean {
    return goal.status === 'draft';
  }

  /**
   * Complete a goal manually or automatically
   */
  static async completeGoal(goalId: string, userId: string): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Check and auto-complete goals that reached 100% progress
   */
  static async checkAutoComplete(userId: string): Promise<Goal[]> {
    // Get all active goals
    const activeGoals = await this.getAllGoals(userId, { status: 'active' });
    const completedGoals: Goal[] = [];

    for (const goal of activeGoals) {
      const overallProgress = this.getOverallProgress(goal);
      if (overallProgress >= 100) {
        const completed = await this.completeGoal(goal.id, userId);
        completedGoals.push(completed);
      }
    }

    return completedGoals;
  }

  /**
   * Get day info for a specific goal
   */
  static getGoalDayInfo(goal: Goal): GoalDayInfo {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(goal.start_date + 'T00:00:00');
    const endDate = new Date(goal.end_date + 'T00:00:00');

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const daysPassed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const currentDay = Math.max(1, Math.min(daysPassed, totalDays));
    const daysRemaining = Math.max(0, totalDays - currentDay);
    const percentElapsed = Math.round((currentDay / totalDays) * 100);

    return {
      currentDay,
      totalDays,
      daysRemaining,
      percentElapsed,
    };
  }

  /**
   * Get expected progress for a specific goal
   */
  static getGoalExpectedProgress(goal: Goal): number {
    const dayInfo = this.getGoalDayInfo(goal);
    return dayInfo.percentElapsed;
  }

  /**
   * Calculate progress for a specific goal (using new Goal type)
   */
  static calculateGoalProgress(goal: Goal): GoalProgress[] {
    const expectedProgress = this.getGoalExpectedProgress(goal);

    const getStatus = (progress: number): GoalStatus => {
      if (progress >= 100) return 'achieved';
      if (progress >= expectedProgress * 0.9) return 'ahead';
      if (progress >= expectedProgress * 0.5) return 'on_track';
      return 'behind';
    };

    const calcProgress = (current: number, target: number): number => {
      if (target <= 0) return 0;
      return Math.round((current / target) * 100 * 10) / 10;
    };

    const metrics: Array<{
      key: 'mrr' | 'clients' | 'tasks' | 'projects';
      label: string;
      unit: string;
      prefix?: string;
    }> = [
      { key: 'mrr', label: 'MRR', unit: '', prefix: 'R$' },
      { key: 'clients', label: 'Novos Clientes', unit: 'clientes' },
      { key: 'tasks', label: 'Tarefas Concluídas', unit: 'tarefas' },
      { key: 'projects', label: 'Projetos Entregues', unit: 'projetos' },
    ];

    return metrics.map((m) => {
      const target = goal[`${m.key}_target` as keyof Goal] as number;
      const current = goal[`${m.key}_current` as keyof Goal] as number;
      const progress = calcProgress(current, target);

      return {
        metric: m.key,
        label: m.label,
        target,
        current,
        progress,
        status: getStatus(progress),
        unit: m.unit,
        prefix: m.prefix,
      };
    });
  }

  /**
   * Get overall progress percentage for a goal
   */
  static getOverallProgress(goal: Goal): number {
    const progress = this.calculateGoalProgress(goal);
    if (progress.length === 0) return 0;

    const total = progress.reduce((sum, p) => sum + p.progress, 0);
    return Math.round(total / progress.length);
  }

  /**
   * Format date range for display
   */
  static formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    return `${formatDate(start)} - ${formatDate(end)}`;
  }
}
