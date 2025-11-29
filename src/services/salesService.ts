import { supabase } from '@/lib/supabase';
import type {
  SalesDailyActivity,
  SalesGoal,
  SalesSummary,
  SalesFunnelStage,
  SalesChartData,
  SalesCheckin,
  SalesActivityInput,
  SalesGoalInput,
  SalesStrategy,
} from '@/types/sales';
import { FUNNEL_COLORS, FUNNEL_LABELS } from '@/types/sales';

export class SalesService {
  // ===== ATIVIDADES DIÁRIAS =====

  static async getTodayActivity(userId: string): Promise<SalesDailyActivity | null> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('sales_daily_activities')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching today activity:', error);
    }
    return data;
  }

  static async getActivityByDate(userId: string, date: string): Promise<SalesDailyActivity | null> {
    const { data, error } = await supabase
      .from('sales_daily_activities')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching activity by date:', error);
    }
    return data;
  }

  static async upsertActivity(
    userId: string,
    date: string,
    updates: SalesActivityInput
  ): Promise<SalesDailyActivity> {
    const { data, error } = await supabase
      .from('sales_daily_activities')
      .upsert(
        {
          user_id: userId,
          date,
          ...updates,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async incrementActivity(
    userId: string,
    field: keyof SalesActivityInput,
    amount: number = 1
  ): Promise<SalesDailyActivity> {
    const today = new Date().toISOString().split('T')[0];
    const existing = await this.getTodayActivity(userId);

    const currentValue = existing ? (existing[field as keyof SalesDailyActivity] as number) || 0 : 0;

    return this.upsertActivity(userId, today, {
      [field]: currentValue + amount,
    });
  }

  static async getActivitiesRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<SalesDailyActivity[]> {
    const { data, error } = await supabase
      .from('sales_daily_activities')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ===== RESUMOS E MÉTRICAS =====

  static async getSummary(userId: string, days: number = 30): Promise<SalesSummary> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await this.getActivitiesRange(
      userId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    const totals = activities.reduce(
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

    const byService = activities.reduce(
      (acc, a) => ({
        automation: acc.automation + (a.service_automation || 0),
        traffic: acc.traffic + (a.service_traffic || 0),
        sites: acc.sites + (a.service_sites || 0),
        bugs: acc.bugs + (a.service_bugs || 0),
      }),
      { automation: 0, traffic: 0, sites: 0, bugs: 0 }
    );

    const daysWithActivity = activities.length || 1;

    return {
      period: `${days} dias`,
      totals,
      averages: {
        contacts_per_day: Math.round(totals.contacts / daysWithActivity),
        calls_per_day: Math.round(totals.calls / daysWithActivity),
        conversion_rate:
          totals.contacts > 0
            ? Math.round((totals.deals / totals.contacts) * 100 * 100) / 100
            : 0,
      },
      trends: {
        contacts_trend: 0, // TODO: calcular vs período anterior
        calls_trend: 0,
        deals_trend: 0,
      },
      byService,
    };
  }

  // ===== FUNIL DE VENDAS =====

  static async getFunnelData(userId: string, days: number = 30): Promise<SalesFunnelStage[]> {
    const summary = await this.getSummary(userId, days);
    const { totals } = summary;

    const stages: SalesFunnelStage[] = [
      {
        stage: 'lead',
        label: FUNNEL_LABELS.lead,
        count: totals.contacts,
        value: totals.contacts,
        conversion_rate: 100,
        color: FUNNEL_COLORS.lead,
      },
      {
        stage: 'qualified',
        label: FUNNEL_LABELS.qualified,
        count: totals.leads,
        value: totals.leads,
        conversion_rate: totals.contacts > 0 ? Math.round((totals.leads / totals.contacts) * 100) : 0,
        color: FUNNEL_COLORS.qualified,
      },
      {
        stage: 'meeting',
        label: FUNNEL_LABELS.meeting,
        count: totals.meetings,
        value: totals.meetings,
        conversion_rate: totals.leads > 0 ? Math.round((totals.meetings / totals.leads) * 100) : 0,
        color: FUNNEL_COLORS.meeting,
      },
      {
        stage: 'proposal',
        label: FUNNEL_LABELS.proposal,
        count: totals.proposals,
        value: totals.proposals,
        conversion_rate: totals.meetings > 0 ? Math.round((totals.proposals / totals.meetings) * 100) : 0,
        color: FUNNEL_COLORS.proposal,
      },
      {
        stage: 'closed',
        label: FUNNEL_LABELS.closed,
        count: totals.deals,
        value: totals.deals,
        conversion_rate: totals.proposals > 0 ? Math.round((totals.deals / totals.proposals) * 100) : 0,
        color: FUNNEL_COLORS.closed,
      },
    ];

    return stages;
  }

  // ===== DADOS PARA GRÁFICOS =====

  static async getChartData(userId: string, days: number = 30): Promise<SalesChartData[]> {
    const activities = await this.getActivitiesRange(
      userId,
      new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );

    return activities
      .map((a) => ({
        date: a.date,
        contacts: a.contacts_sent || 0,
        calls: a.calls_made || 0,
        meetings: a.meetings_held || 0,
        proposals: a.proposals_sent || 0,
        deals: a.deals_closed || 0,
      }))
      .reverse(); // Ordem cronológica para gráficos
  }

  // ===== METAS =====

  static async getActiveGoal(userId: string): Promise<SalesGoal | null> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('sales_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .lte('start_date', today)
      .gte('end_date', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching active goal:', error);
    }
    return data;
  }

  static async getAllGoals(userId: string, status?: string): Promise<SalesGoal[]> {
    let query = supabase
      .from('sales_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async createGoal(userId: string, input: SalesGoalInput): Promise<SalesGoal> {
    const { data, error } = await supabase
      .from('sales_goals')
      .insert({
        user_id: userId,
        ...input,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateGoal(goalId: string, userId: string, updates: Partial<SalesGoalInput>): Promise<SalesGoal> {
    const { data, error } = await supabase
      .from('sales_goals')
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

  static async deleteGoal(goalId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('sales_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // ===== CHECK-IN =====

  static async shouldAutoCheckin(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];

    // Verificar se já fez check-in hoje
    const { data: todayCheckin } = await supabase
      .from('sales_checkins')
      .select('id')
      .eq('user_id', userId)
      .eq('date', today)
      .limit(1)
      .single();

    if (todayCheckin) return false;

    // Verificar se passou 24h desde último acesso
    const { data: lastCheckin } = await supabase
      .from('sales_checkins')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!lastCheckin) return true; // Primeiro acesso

    const lastTime = new Date(lastCheckin.created_at).getTime();
    const now = Date.now();
    const hoursSinceLastCheckin = (now - lastTime) / (1000 * 60 * 60);

    return hoursSinceLastCheckin >= 24;
  }

  static async createCheckin(
    userId: string,
    triggerType: 'manual' | 'automatic' | 'chat'
  ): Promise<SalesCheckin> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('sales_checkins')
      .insert({
        user_id: userId,
        trigger_type: triggerType,
        date: today,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateCheckin(
    checkinId: string,
    userId: string,
    updates: Partial<{
      questions_asked: string[];
      responses: Record<string, unknown>;
      ai_summary: string;
      ai_suggestions: string[];
      completed_at: string;
    }>
  ): Promise<SalesCheckin> {
    const { data, error } = await supabase
      .from('sales_checkins')
      .update(updates)
      .eq('id', checkinId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async completeCheckin(checkinId: string, userId: string): Promise<SalesCheckin> {
    return this.updateCheckin(checkinId, userId, {
      completed_at: new Date().toISOString(),
    });
  }

  // ===== ESTRATÉGIAS =====

  static async getStrategies(userId: string, status?: string): Promise<SalesStrategy[]> {
    let query = supabase
      .from('sales_strategies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async createStrategy(
    userId: string,
    strategy: {
      title: string;
      description: string;
      action_items: string[];
      based_on_analysis?: string;
      expected_impact?: string;
    }
  ): Promise<SalesStrategy> {
    const { data, error } = await supabase
      .from('sales_strategies')
      .insert({
        user_id: userId,
        ...strategy,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateStrategyStatus(
    strategyId: string,
    userId: string,
    status: 'suggested' | 'in_progress' | 'completed' | 'dismissed'
  ): Promise<SalesStrategy> {
    const { data, error } = await supabase
      .from('sales_strategies')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', strategyId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
