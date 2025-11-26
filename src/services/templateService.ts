import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

// =====================================================
// TYPES
// =====================================================
type ServiceTemplateRow = Database['public']['Tables']['service_templates']['Row'];
type ServiceTemplateInsert = Database['public']['Tables']['service_templates']['Insert'];
type ServiceTemplateUpdate = Database['public']['Tables']['service_templates']['Update'];

type TemplateProjectRow = Database['public']['Tables']['template_projects']['Row'];
type TemplateProjectInsert = Database['public']['Tables']['template_projects']['Insert'];
type TemplateProjectUpdate = Database['public']['Tables']['template_projects']['Update'];

type TemplateTaskRow = Database['public']['Tables']['template_tasks']['Row'];
type TemplateTaskInsert = Database['public']['Tables']['template_tasks']['Insert'];
type TemplateTaskUpdate = Database['public']['Tables']['template_tasks']['Update'];

type ClientOnboardingStatusRow = Database['public']['Tables']['client_onboarding_status']['Row'];

// =====================================================
// INTERFACES PARA RETORNO
// =====================================================
export interface ServiceTemplate {
  id: string;
  name: string;
  serviceType: string;
  description: string | null;
  isActive: boolean;
  icon: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateProject {
  id: string;
  serviceTemplateId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isRequired: boolean;
  estimatedDurationDays: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateTask {
  id: string;
  templateProjectId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  isRequired: boolean;
  daysAfterStart: number;
  dependsOnTaskId: string | null;
  assignedToRole: string | null;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientOnboardingStatus {
  id: string;
  clientId: string;
  serviceTemplateId: string;
  status: string;
  progressPercentage: number;
  startedAt: string | null;
  completedAt: string | null;
  pausedAt: string | null;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateWithDetails extends ServiceTemplate {
  projects: (TemplateProject & { tasks: TemplateTask[] })[];
}

// =====================================================
// TRANSFORMERS
// =====================================================
function transformServiceTemplateFromDB(row: ServiceTemplateRow): ServiceTemplate {
  return {
    id: row.id,
    name: row.name,
    serviceType: row.service_type,
    description: row.description,
    isActive: row.is_active ?? true,
    icon: row.icon,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function transformTemplateProjectFromDB(row: TemplateProjectRow): TemplateProject {
  return {
    id: row.id,
    serviceTemplateId: row.service_template_id,
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order ?? 0,
    isRequired: row.is_required ?? true,
    estimatedDurationDays: row.estimated_duration_days,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function transformTemplateTaskFromDB(row: TemplateTaskRow): TemplateTask {
  return {
    id: row.id,
    templateProjectId: row.template_project_id,
    title: row.title,
    description: row.description,
    sortOrder: row.sort_order ?? 0,
    isRequired: row.is_required ?? true,
    daysAfterStart: row.days_after_start ?? 0,
    dependsOnTaskId: row.depends_on_task_id,
    assignedToRole: row.assigned_to_role,
    category: row.category,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function transformOnboardingStatusFromDB(row: ClientOnboardingStatusRow): ClientOnboardingStatus {
  return {
    id: row.id,
    clientId: row.client_id,
    serviceTemplateId: row.service_template_id,
    status: row.status ?? 'not_started',
    progressPercentage: row.progress_percentage ?? 0,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    pausedAt: row.paused_at,
    totalTasks: row.total_tasks ?? 0,
    completedTasks: row.completed_tasks ?? 0,
    pendingTasks: row.pending_tasks ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// =====================================================
// SERVICE CLASS
// =====================================================
export class TemplateService {
  // ===================================================
  // SERVICE TEMPLATES
  // ===================================================

  /**
   * Buscar todos os templates de serviço
   */
  static async getAllServiceTemplates(activeOnly = false): Promise<ServiceTemplate[]> {
    let query = supabase
      .from('service_templates')
      .select('*')
      .order('name', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(transformServiceTemplateFromDB);
  }

  /**
   * Buscar template de serviço por ID
   */
  static async getServiceTemplateById(templateId: string): Promise<ServiceTemplate> {
    const { data, error } = await supabase
      .from('service_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) throw error;
    return transformServiceTemplateFromDB(data);
  }

  /**
   * Buscar template por tipo de serviço (client_segment)
   */
  static async getServiceTemplateByType(serviceType: string): Promise<ServiceTemplate | null> {
    const { data, error } = await supabase
      .from('service_templates')
      .select('*')
      .eq('service_type', serviceType)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return transformServiceTemplateFromDB(data);
  }

  /**
   * Criar novo template de serviço
   */
  static async createServiceTemplate(template: Partial<ServiceTemplate>): Promise<ServiceTemplate> {
    const insert: ServiceTemplateInsert = {
      name: template.name!,
      service_type: template.serviceType!,
      description: template.description,
      is_active: template.isActive ?? true,
      icon: template.icon,
      color: template.color,
    };

    const { data, error } = await supabase
      .from('service_templates')
      .insert(insert)
      .select()
      .single();

    if (error) throw error;
    return transformServiceTemplateFromDB(data);
  }

  /**
   * Atualizar template de serviço
   */
  static async updateServiceTemplate(
    templateId: string,
    updates: Partial<ServiceTemplate>
  ): Promise<ServiceTemplate> {
    const update: ServiceTemplateUpdate = {};

    if (updates.name !== undefined) update.name = updates.name;
    if (updates.description !== undefined) update.description = updates.description;
    if (updates.isActive !== undefined) update.is_active = updates.isActive;
    if (updates.icon !== undefined) update.icon = updates.icon;
    if (updates.color !== undefined) update.color = updates.color;

    const { data, error } = await supabase
      .from('service_templates')
      .update(update)
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;
    return transformServiceTemplateFromDB(data);
  }

  /**
   * Deletar template de serviço (CASCADE delete projects e tasks)
   */
  static async deleteServiceTemplate(templateId: string): Promise<void> {
    const { error } = await supabase
      .from('service_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;
  }

  // ===================================================
  // TEMPLATE PROJECTS
  // ===================================================

  /**
   * Buscar projetos de um template
   */
  static async getTemplateProjects(serviceTemplateId: string): Promise<TemplateProject[]> {
    const { data, error } = await supabase
      .from('template_projects')
      .select('*')
      .eq('service_template_id', serviceTemplateId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []).map(transformTemplateProjectFromDB);
  }

  /**
   * Criar projeto de template
   */
  static async createTemplateProject(project: Partial<TemplateProject>): Promise<TemplateProject> {
    const insert: TemplateProjectInsert = {
      service_template_id: project.serviceTemplateId!,
      name: project.name!,
      description: project.description,
      sort_order: project.sortOrder ?? 0,
      is_required: project.isRequired ?? true,
      estimated_duration_days: project.estimatedDurationDays,
    };

    const { data, error } = await supabase
      .from('template_projects')
      .insert(insert)
      .select()
      .single();

    if (error) throw error;
    return transformTemplateProjectFromDB(data);
  }

  /**
   * Atualizar projeto de template
   */
  static async updateTemplateProject(
    projectId: string,
    updates: Partial<TemplateProject>
  ): Promise<TemplateProject> {
    const update: TemplateProjectUpdate = {};

    if (updates.name !== undefined) update.name = updates.name;
    if (updates.description !== undefined) update.description = updates.description;
    if (updates.sortOrder !== undefined) update.sort_order = updates.sortOrder;
    if (updates.isRequired !== undefined) update.is_required = updates.isRequired;
    if (updates.estimatedDurationDays !== undefined)
      update.estimated_duration_days = updates.estimatedDurationDays;

    const { data, error } = await supabase
      .from('template_projects')
      .update(update)
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return transformTemplateProjectFromDB(data);
  }

  /**
   * Deletar projeto de template (CASCADE delete tasks)
   */
  static async deleteTemplateProject(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('template_projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  }

  // ===================================================
  // TEMPLATE TASKS
  // ===================================================

  /**
   * Buscar tarefas de um projeto template
   */
  static async getTemplateTasks(templateProjectId: string): Promise<TemplateTask[]> {
    const { data, error } = await supabase
      .from('template_tasks')
      .select('*')
      .eq('template_project_id', templateProjectId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []).map(transformTemplateTaskFromDB);
  }

  /**
   * Criar tarefa de template
   */
  static async createTemplateTask(task: Partial<TemplateTask>): Promise<TemplateTask> {
    const insert: TemplateTaskInsert = {
      template_project_id: task.templateProjectId!,
      title: task.title!,
      description: task.description,
      sort_order: task.sortOrder ?? 0,
      is_required: task.isRequired ?? true,
      days_after_start: task.daysAfterStart ?? 0,
      depends_on_task_id: task.dependsOnTaskId,
      assigned_to_role: task.assignedToRole,
      category: task.category,
    };

    const { data, error } = await supabase
      .from('template_tasks')
      .insert(insert)
      .select()
      .single();

    if (error) throw error;
    return transformTemplateTaskFromDB(data);
  }

  /**
   * Atualizar tarefa de template
   */
  static async updateTemplateTask(
    taskId: string,
    updates: Partial<TemplateTask>
  ): Promise<TemplateTask> {
    const update: TemplateTaskUpdate = {};

    if (updates.title !== undefined) update.title = updates.title;
    if (updates.description !== undefined) update.description = updates.description;
    if (updates.sortOrder !== undefined) update.sort_order = updates.sortOrder;
    if (updates.isRequired !== undefined) update.is_required = updates.isRequired;
    if (updates.daysAfterStart !== undefined) update.days_after_start = updates.daysAfterStart;
    if (updates.dependsOnTaskId !== undefined) update.depends_on_task_id = updates.dependsOnTaskId;
    if (updates.assignedToRole !== undefined) update.assigned_to_role = updates.assignedToRole;
    if (updates.category !== undefined) update.category = updates.category;

    const { data, error } = await supabase
      .from('template_tasks')
      .update(update)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return transformTemplateTaskFromDB(data);
  }

  /**
   * Deletar tarefa de template
   */
  static async deleteTemplateTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('template_tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  }

  // ===================================================
  // TEMPLATE COMPLETO COM HIERARQUIA
  // ===================================================

  /**
   * Buscar template completo com projetos e tarefas
   */
  static async getTemplateWithDetails(templateId: string): Promise<TemplateWithDetails> {
    // Buscar template
    const template = await this.getServiceTemplateById(templateId);

    // Buscar projetos do template
    const projects = await this.getTemplateProjects(templateId);

    // Buscar tarefas de cada projeto
    const projectsWithTasks = await Promise.all(
      projects.map(async (project) => {
        const tasks = await this.getTemplateTasks(project.id);
        return { ...project, tasks };
      })
    );

    return {
      ...template,
      projects: projectsWithTasks,
    };
  }

  // ===================================================
  // CLIENT ONBOARDING STATUS
  // ===================================================

  /**
   * Buscar status de onboarding de um cliente
   */
  static async getClientOnboardingStatus(clientId: string): Promise<ClientOnboardingStatus | null> {
    const { data, error } = await supabase
      .from('client_onboarding_status')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return transformOnboardingStatusFromDB(data);
  }

  /**
   * Buscar todos os status de onboarding (com filtros opcionais)
   */
  static async getAllOnboardingStatuses(filters?: {
    status?: string;
    serviceTemplateId?: string;
  }): Promise<ClientOnboardingStatus[]> {
    let query = supabase
      .from('client_onboarding_status')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.serviceTemplateId) {
      query = query.eq('service_template_id', filters.serviceTemplateId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(transformOnboardingStatusFromDB);
  }

  /**
   * Atualizar status de onboarding manualmente
   * (normalmente atualizado por triggers)
   */
  static async updateOnboardingStatus(
    statusId: string,
    updates: {
      status?: string;
      pausedAt?: string | null;
    }
  ): Promise<ClientOnboardingStatus> {
    const update: any = {};

    if (updates.status !== undefined) update.status = updates.status;
    if (updates.pausedAt !== undefined) update.paused_at = updates.pausedAt;

    const { data, error } = await supabase
      .from('client_onboarding_status')
      .update(update)
      .eq('id', statusId)
      .select()
      .single();

    if (error) throw error;
    return transformOnboardingStatusFromDB(data);
  }
}
