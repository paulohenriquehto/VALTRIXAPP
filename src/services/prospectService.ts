import { supabase } from '../lib/supabase';
import type {
  PipelineStage,
  StageInput,
  StageUpdate,
  Prospect,
  ProspectInput,
  ProspectUpdate,
  ProspectInteraction,
  InteractionInput,
  ProspectFilters,
  StageMetrics,
  PipelineMetrics,
} from '../types/prospects';

// =============================================
// PIPELINE STAGES (Colunas do Kanban)
// =============================================

export class ProspectService {
  /**
   * Buscar todos os stages do usuario
   */
  static async getStages(userId: string): Promise<PipelineStage[]> {
    const { data, error } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true });

    if (error) throw error;
    return (data || []).map(transformStageFromDB);
  }

  /**
   * Buscar stages com metricas (count e valor por coluna)
   */
  static async getStagesWithMetrics(userId: string): Promise<PipelineStage[]> {
    // Buscar stages
    const { data: stages, error: stagesError } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true });

    if (stagesError) throw stagesError;

    // Buscar metricas agregadas por stage
    const { data: metrics, error: metricsError } = await supabase
      .from('prospects')
      .select('stage_id, expected_value')
      .eq('user_id', userId)
      .eq('status', 'open');

    if (metricsError) throw metricsError;

    // Agregar metricas por stage
    const metricsMap = new Map<string, { count: number; total: number }>();
    (metrics || []).forEach((p) => {
      const current = metricsMap.get(p.stage_id) || { count: 0, total: 0 };
      metricsMap.set(p.stage_id, {
        count: current.count + 1,
        total: current.total + (p.expected_value || 0),
      });
    });

    return (stages || []).map((stage) => {
      const stageMetrics = metricsMap.get(stage.id) || { count: 0, total: 0 };
      const transformed = transformStageFromDB(stage);
      return {
        ...transformed,
        prospectCount: stageMetrics.count,
        totalValue: stageMetrics.total,
        weightedValue: stageMetrics.total * (stage.probability / 100),
      };
    });
  }

  /**
   * Criar novo stage
   */
  static async createStage(userId: string, input: StageInput): Promise<PipelineStage> {
    // Buscar a maior posicao atual
    const { data: maxPosData } = await supabase
      .from('pipeline_stages')
      .select('position')
      .eq('user_id', userId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = maxPosData && maxPosData.length > 0 ? maxPosData[0].position + 1 : 0;

    const { data, error } = await supabase
      .from('pipeline_stages')
      .insert({
        user_id: userId,
        name: input.name,
        color: input.color || '#6B7280',
        probability: input.probability || 0,
        is_win_stage: input.isWinStage || false,
        is_loss_stage: input.isLossStage || false,
        position: nextPosition,
      })
      .select()
      .single();

    if (error) throw error;
    return transformStageFromDB(data);
  }

  /**
   * Atualizar stage
   */
  static async updateStage(stageId: string, updates: StageUpdate): Promise<PipelineStage> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.probability !== undefined) updateData.probability = updates.probability;
    if (updates.isWinStage !== undefined) updateData.is_win_stage = updates.isWinStage;
    if (updates.isLossStage !== undefined) updateData.is_loss_stage = updates.isLossStage;

    const { data, error } = await supabase
      .from('pipeline_stages')
      .update(updateData)
      .eq('id', stageId)
      .select()
      .single();

    if (error) throw error;
    return transformStageFromDB(data);
  }

  /**
   * Deletar stage (apenas se vazio)
   */
  static async deleteStage(stageId: string): Promise<void> {
    // Verificar se tem prospects
    const { count, error: countError } = await supabase
      .from('prospects')
      .select('*', { count: 'exact', head: true })
      .eq('stage_id', stageId);

    if (countError) throw countError;
    if (count && count > 0) {
      throw new Error('Nao e possivel deletar um stage que possui prospects. Mova os prospects primeiro.');
    }

    const { error } = await supabase.from('pipeline_stages').delete().eq('id', stageId);

    if (error) throw error;
  }

  /**
   * Reordenar stages
   */
  static async reorderStages(userId: string, stageIds: string[]): Promise<void> {
    // Atualizar posicao de cada stage
    const updates = stageIds.map((id, index) =>
      supabase.from('pipeline_stages').update({ position: index }).eq('id', id).eq('user_id', userId)
    );

    await Promise.all(updates);
  }

  /**
   * Criar stages padrao para usuario (se nao existirem)
   */
  static async createDefaultStages(userId: string): Promise<void> {
    const { data: existing } = await supabase
      .from('pipeline_stages')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (existing && existing.length > 0) return;

    // Chamar funcao do banco
    const { error } = await supabase.rpc('create_default_pipeline_stages', {
      p_user_id: userId,
    });

    if (error) throw error;
  }

  // =============================================
  // PROSPECTS (Cards do Kanban)
  // =============================================

  /**
   * Buscar todos os prospects do usuario
   */
  static async getProspects(userId: string, filters?: ProspectFilters): Promise<Prospect[]> {
    let query = supabase
      .from('prospects')
      .select(
        `
        *,
        prospect_tags!left(tag_id, tags(*))
      `
      )
      .eq('user_id', userId)
      .order('position_in_stage', { ascending: true });

    // Aplicar filtros
    if (filters) {
      if (filters.stageIds && filters.stageIds.length > 0) {
        query = query.in('stage_id', filters.stageIds);
      }
      if (filters.statuses && filters.statuses.length > 0) {
        query = query.in('status', filters.statuses);
      } else {
        // Default: apenas abertos
        query = query.eq('status', 'open');
      }
      if (filters.priorities && filters.priorities.length > 0) {
        query = query.in('priority', filters.priorities);
      }
      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }
      if (filters.minValue !== undefined) {
        query = query.gte('expected_value', filters.minValue);
      }
      if (filters.maxValue !== undefined) {
        query = query.lte('expected_value', filters.maxValue);
      }
      if (filters.sources && filters.sources.length > 0) {
        query = query.in('source', filters.sources);
      }
    } else {
      // Default: apenas abertos
      query = query.eq('status', 'open');
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(transformProspectFromDB);
  }

  /**
   * Buscar prospect por ID
   */
  static async getProspectById(prospectId: string): Promise<Prospect> {
    const { data, error } = await supabase
      .from('prospects')
      .select(
        `
        *,
        prospect_tags!left(tag_id, tags(*))
      `
      )
      .eq('id', prospectId)
      .single();

    if (error) throw error;
    return transformProspectFromDB(data);
  }

  /**
   * Criar novo prospect
   */
  static async createProspect(userId: string, stageId: string, input: ProspectInput): Promise<Prospect> {
    // Buscar a maior posicao no stage
    const { data: maxPosData } = await supabase
      .from('prospects')
      .select('position_in_stage')
      .eq('stage_id', stageId)
      .order('position_in_stage', { ascending: false })
      .limit(1);

    const nextPosition = maxPosData && maxPosData.length > 0 ? maxPosData[0].position_in_stage + 1 : 0;

    const { data, error } = await supabase
      .from('prospects')
      .insert({
        user_id: userId,
        stage_id: stageId,
        name: input.name,
        company_name: input.companyName || null,
        email: input.email || null,
        phone: input.phone || null,
        expected_value: input.expectedValue || 0,
        expected_close_date: input.expectedCloseDate || null,
        priority: input.priority || 'medium',
        source: input.source || null,
        notes: input.notes || null,
        position_in_stage: nextPosition,
        status: 'open',
      })
      .select()
      .single();

    if (error) throw error;

    // Adicionar tags se houver
    if (input.tagIds && input.tagIds.length > 0) {
      const tagInserts = input.tagIds.map((tagId) => ({
        prospect_id: data.id,
        tag_id: tagId,
      }));
      await supabase.from('prospect_tags').insert(tagInserts);
    }

    return transformProspectFromDB(data);
  }

  /**
   * Atualizar prospect
   */
  static async updateProspect(prospectId: string, updates: ProspectUpdate): Promise<Prospect> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.companyName !== undefined) updateData.company_name = updates.companyName;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.expectedValue !== undefined) updateData.expected_value = updates.expectedValue;
    if (updates.expectedCloseDate !== undefined) updateData.expected_close_date = updates.expectedCloseDate;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.source !== undefined) updateData.source = updates.source;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from('prospects')
      .update(updateData)
      .eq('id', prospectId)
      .select(
        `
        *,
        prospect_tags!left(tag_id, tags(*))
      `
      )
      .single();

    if (error) throw error;

    // Atualizar tags se houver
    if (updates.tagIds !== undefined) {
      // Remover tags antigas
      await supabase.from('prospect_tags').delete().eq('prospect_id', prospectId);

      // Adicionar novas
      if (updates.tagIds.length > 0) {
        const tagInserts = updates.tagIds.map((tagId) => ({
          prospect_id: prospectId,
          tag_id: tagId,
        }));
        await supabase.from('prospect_tags').insert(tagInserts);
      }
    }

    return transformProspectFromDB(data);
  }

  /**
   * Deletar prospect
   */
  static async deleteProspect(prospectId: string): Promise<void> {
    const { error } = await supabase.from('prospects').delete().eq('id', prospectId);

    if (error) throw error;
  }

  /**
   * Mover prospect para outro stage (drag-and-drop)
   */
  static async moveProspect(prospectId: string, targetStageId: string, newPosition: number, userId: string): Promise<void> {
    const { error } = await supabase.rpc('move_prospect_to_stage', {
      p_prospect_id: prospectId,
      p_target_stage_id: targetStageId,
      p_new_position: newPosition,
      p_user_id: userId,
    });

    if (error) throw error;
  }

  /**
   * Marcar como ganho
   */
  static async markAsWon(prospectId: string, userId: string): Promise<Prospect> {
    // Buscar stage de ganho
    const { data: winStage } = await supabase
      .from('pipeline_stages')
      .select('id')
      .eq('user_id', userId)
      .eq('is_win_stage', true)
      .single();

    const updateData: any = {
      status: 'won',
      updated_at: new Date().toISOString(),
    };

    if (winStage) {
      updateData.stage_id = winStage.id;
    }

    const { data, error } = await supabase.from('prospects').update(updateData).eq('id', prospectId).select().single();

    if (error) throw error;
    return transformProspectFromDB(data);
  }

  /**
   * Marcar como perdido
   */
  static async markAsLost(prospectId: string, userId: string, reason?: string): Promise<Prospect> {
    // Buscar stage de perda
    const { data: lossStage } = await supabase
      .from('pipeline_stages')
      .select('id')
      .eq('user_id', userId)
      .eq('is_loss_stage', true)
      .single();

    const updateData: any = {
      status: 'lost',
      updated_at: new Date().toISOString(),
    };

    if (lossStage) {
      updateData.stage_id = lossStage.id;
    }

    if (reason) {
      updateData.notes = reason;
    }

    const { data, error } = await supabase.from('prospects').update(updateData).eq('id', prospectId).select().single();

    if (error) throw error;
    return transformProspectFromDB(data);
  }

  /**
   * Converter prospect em cliente
   */
  static async convertToClient(prospectId: string, userId: string): Promise<string> {
    const { data, error } = await supabase.rpc('convert_prospect_to_client', {
      p_prospect_id: prospectId,
      p_user_id: userId,
    });

    if (error) throw error;
    return data as string; // Retorna o ID do novo cliente
  }

  // =============================================
  // INTERACOES (Historico de atividades)
  // =============================================

  /**
   * Buscar interacoes de um prospect
   */
  static async getInteractions(prospectId: string): Promise<ProspectInteraction[]> {
    const { data, error } = await supabase
      .from('prospect_interactions')
      .select(
        `
        *,
        user:users(*),
        from_stage:pipeline_stages!prospect_interactions_from_stage_id_fkey(*),
        to_stage:pipeline_stages!prospect_interactions_to_stage_id_fkey(*)
      `
      )
      .eq('prospect_id', prospectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformInteractionFromDB);
  }

  /**
   * Criar nova interacao
   */
  static async createInteraction(prospectId: string, userId: string, input: InteractionInput): Promise<ProspectInteraction> {
    const { data, error } = await supabase
      .from('prospect_interactions')
      .insert({
        prospect_id: prospectId,
        user_id: userId,
        type: input.type,
        title: input.title,
        description: input.description || null,
        duration_minutes: input.durationMinutes || null,
      })
      .select()
      .single();

    if (error) throw error;
    return transformInteractionFromDB(data);
  }

  // =============================================
  // METRICAS
  // =============================================

  /**
   * Buscar metricas do pipeline
   */
  static async getPipelineMetrics(userId: string): Promise<PipelineMetrics> {
    // Buscar todos os prospects abertos
    const { data: prospects, error: prospectsError } = await supabase
      .from('prospects')
      .select('*, pipeline_stages(*)')
      .eq('user_id', userId);

    if (prospectsError) throw prospectsError;

    // Buscar stages para metricas
    const { data: stages, error: stagesError } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('user_id', userId)
      .order('position');

    if (stagesError) throw stagesError;

    // Calcular metricas
    const openProspects = (prospects || []).filter((p) => p.status === 'open');
    const wonProspects = (prospects || []).filter((p) => p.status === 'won');
    const lostProspects = (prospects || []).filter((p) => p.status === 'lost');

    const totalValue = openProspects.reduce((sum, p) => sum + (p.expected_value || 0), 0);
    const wonValue = wonProspects.reduce((sum, p) => sum + (p.expected_value || 0), 0);

    // Metricas por stage
    const byStage: StageMetrics[] = (stages || []).map((stage) => {
      const stageProspects = openProspects.filter((p) => p.stage_id === stage.id);
      const stageValue = stageProspects.reduce((sum, p) => sum + (p.expected_value || 0), 0);
      return {
        stageId: stage.id,
        stageName: stage.name,
        color: stage.color,
        position: stage.position,
        probability: stage.probability,
        prospectCount: stageProspects.length,
        totalValue: stageValue,
        weightedValue: stageValue * (stage.probability / 100),
      };
    });

    // Metricas por prioridade
    const byPriority: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };
    openProspects.forEach((p) => {
      byPriority[p.priority] = (byPriority[p.priority] || 0) + 1;
    });

    // Metricas por status
    const byStatus: Record<string, number> = {
      open: openProspects.length,
      won: wonProspects.length,
      lost: lostProspects.length,
      archived: (prospects || []).filter((p) => p.status === 'archived').length,
    };

    // Taxa de conversao
    const totalClosedDeals = wonProspects.length + lostProspects.length;
    const conversionRate = totalClosedDeals > 0 ? (wonProspects.length / totalClosedDeals) * 100 : 0;

    return {
      totalProspects: openProspects.length,
      totalValue,
      weightedValue: byStage.reduce((sum, s) => sum + s.weightedValue, 0),
      avgDealSize: openProspects.length > 0 ? totalValue / openProspects.length : 0,
      byStage,
      byPriority: byPriority as Record<any, number>,
      byStatus: byStatus as Record<any, number>,
      conversionRate,
      avgTimeToClose: 0, // TODO: calcular media de dias para fechar
    };
  }
}

// =============================================
// TRANSFORMERS
// =============================================

function transformStageFromDB(dbStage: any): PipelineStage {
  return {
    id: dbStage.id,
    userId: dbStage.user_id,
    name: dbStage.name,
    color: dbStage.color || '#6B7280',
    position: dbStage.position,
    isDefault: dbStage.is_default || false,
    isWinStage: dbStage.is_win_stage || false,
    isLossStage: dbStage.is_loss_stage || false,
    probability: dbStage.probability || 0,
    createdAt: dbStage.created_at,
    updatedAt: dbStage.updated_at,
  };
}

function transformProspectFromDB(dbProspect: any): Prospect {
  // Extrair tags do join
  const tags =
    dbProspect.prospect_tags
      ?.filter((pt: any) => pt.tags)
      .map((pt: any) => ({
        id: pt.tags.id,
        name: pt.tags.name,
        color: pt.tags.color,
        userId: pt.tags.user_id,
        usageCount: pt.tags.usage_count || 0,
        createdAt: pt.tags.created_at,
      })) || [];

  return {
    id: dbProspect.id,
    userId: dbProspect.user_id,
    stageId: dbProspect.stage_id,
    name: dbProspect.name,
    companyName: dbProspect.company_name || undefined,
    email: dbProspect.email || undefined,
    phone: dbProspect.phone || undefined,
    positionInStage: dbProspect.position_in_stage || 0,
    expectedValue: dbProspect.expected_value || 0,
    expectedCloseDate: dbProspect.expected_close_date || undefined,
    priority: dbProspect.priority || 'medium',
    status: dbProspect.status || 'open',
    source: dbProspect.source || undefined,
    notes: dbProspect.notes || undefined,
    enteredStageAt: dbProspect.entered_stage_at || dbProspect.created_at,
    lastInteractionAt: dbProspect.last_interaction_at || undefined,
    convertedClientId: dbProspect.converted_client_id || undefined,
    convertedAt: dbProspect.converted_at || undefined,
    createdAt: dbProspect.created_at,
    updatedAt: dbProspect.updated_at,
    tags,
  };
}

function transformInteractionFromDB(dbInteraction: any): ProspectInteraction {
  return {
    id: dbInteraction.id,
    prospectId: dbInteraction.prospect_id,
    userId: dbInteraction.user_id,
    type: dbInteraction.type,
    title: dbInteraction.title,
    description: dbInteraction.description || undefined,
    durationMinutes: dbInteraction.duration_minutes || undefined,
    fromStageId: dbInteraction.from_stage_id || undefined,
    toStageId: dbInteraction.to_stage_id || undefined,
    createdAt: dbInteraction.created_at,
    user: dbInteraction.user
      ? {
          id: dbInteraction.user.id,
          email: dbInteraction.user.email,
          fullName: dbInteraction.user.full_name || 'Usuario',
          avatarUrl: dbInteraction.user.avatar_url || undefined,
          timezone: dbInteraction.user.timezone || 'UTC',
          theme: dbInteraction.user.theme || 'light',
          isActive: dbInteraction.user.is_active ?? true,
          createdAt: dbInteraction.user.created_at,
          updatedAt: dbInteraction.user.updated_at,
        }
      : undefined,
    fromStage: dbInteraction.from_stage ? transformStageFromDB(dbInteraction.from_stage) : undefined,
    toStage: dbInteraction.to_stage ? transformStageFromDB(dbInteraction.to_stage) : undefined,
  };
}
